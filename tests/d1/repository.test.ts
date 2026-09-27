import { env } from "cloudflare:test";
import { expect, test } from "vite-plus/test";
import { createAchievementRepository } from "../../src/lib/server/achievement/repository";

const GENERATED_SLUG_PATTERN = /^achievement-[0-9a-f]{8}$/;

test("creates and retrieves a published achievement", async () => {
  const repository = createAchievementRepository(env.DB);
  const created = await repository.create({
    occurredAt: "2026-09-27",
    summary: "D1 に保存できた。",
    title: "実績を公開した",
  });

  expect(created).toMatchObject({
    occurredAt: "2026-09-27",
    revision: 1,
    summary: "D1 に保存できた。",
    title: "実績を公開した",
  });
  expect(created.slug).toMatch(GENERATED_SLUG_PATTERN);
  await expect(repository.get(created.id)).resolves.toMatchObject(created);
});

test("reuses normalized tags and preserves links in display order", async () => {
  const repository = createAchievementRepository(env.DB);
  const created = await repository.create({
    links: [
      { label: "First", url: "https://example.com/first" },
      { url: "https://example.com/second" },
    ],
    occurredAt: "2026-09-26",
    summary: "タグとリンクを保存した。",
    tags: ["  Ｃｌｏｕｄｆｌａｒｅ ", "cloudflare", " Workers "],
    title: "Cloudflare Workers の OGP を公開した",
  });

  expect(created.tags).toEqual([
    { name: "Cloudflare", normalized: "cloudflare" },
    { name: "Workers", normalized: "workers" },
  ]);
  expect(created.links.map(({ url, position }) => [url, position])).toEqual([
    ["https://example.com/first", 0],
    ["https://example.com/second", 1],
  ]);
  await expect(repository.get(created.slug)).resolves.toMatchObject(created);
});

test("filters by every tag and paginates in date order", async () => {
  const repository = createAchievementRepository(env.DB);
  await repository.create({
    occurredAt: "2026-09-25",
    summary: "Both tags.",
    tags: ["project-tag", "server-tag"],
    title: "Older matching achievement",
  });
  const newer = await repository.create({
    occurredAt: "2026-09-27",
    summary: "Both tags.",
    tags: ["project-tag", "server-tag"],
    title: "Newer matching achievement",
  });
  await repository.create({
    occurredAt: "2026-09-28",
    summary: "Only one tag.",
    tags: ["project-tag"],
    title: "One-tag achievement",
  });

  const firstPage = await repository.list({
    limit: 1,
    tags: ["PROJECT-TAG", "server-tag"],
  });
  expect(firstPage.items.map(({ id }) => id)).toEqual([newer.id]);
  expect(firstPage.nextCursor).toBeTruthy();

  const secondPage = await repository.list({
    cursor: firstPage.nextCursor ?? undefined,
    limit: 1,
    tags: ["project-tag", "server-tag"],
  });
  expect(secondPage.items).toHaveLength(1);
  expect(secondPage.items[0]?.occurredAt).toBe("2026-09-25");
  expect(secondPage.nextCursor).toBeNull();
});

test("updates only at the expected revision and keeps the slug stable", async () => {
  const repository = createAchievementRepository(env.DB);
  const created = await repository.create({
    occurredAt: "2026-09-27",
    summary: "Original summary.",
    tags: ["before"],
    title: "Original title",
  });

  const updated = await repository.update(created.id, 1, {
    summary: "Updated summary.",
    tags: ["after"],
  });
  expect(updated).toMatchObject({
    revision: 2,
    slug: created.slug,
    summary: "Updated summary.",
    tags: [{ name: "after", normalized: "after" }],
  });
  await expect(
    repository.update(created.id, 1, { summary: "Stale overwrite." })
  ).rejects.toMatchObject({ name: "RevisionConflictError" });
  await expect(repository.get(created.id)).resolves.toMatchObject({
    revision: 2,
    summary: "Updated summary.",
  });
});

test("restores the latest saved version after an edit", async () => {
  const repository = createAchievementRepository(env.DB);
  const created = await repository.create({
    links: [{ label: "Original", url: "https://example.com/original" }],
    occurredAt: "2026-09-27",
    summary: "Original version.",
    tags: ["original-tag"],
    title: "Original title",
  });
  await repository.update(created.id, 1, {
    links: [{ label: "Changed", url: "https://example.com/changed" }],
    summary: "Changed version.",
    tags: ["changed-tag"],
  });

  const restored = await repository.restore(created.id);
  expect(restored).toMatchObject({
    links: [{ label: "Original", url: "https://example.com/original" }],
    revision: 3,
    summary: "Original version.",
    tags: [{ name: "original-tag", normalized: "original-tag" }],
  });
});

test("soft-deletes, hides, and restores an achievement", async () => {
  const repository = createAchievementRepository(env.DB);
  const created = await repository.create({
    occurredAt: "2026-09-27",
    summary: "Delete then restore.",
    tags: ["restore-test"],
    title: "Restorable achievement",
  });

  const deleted = await repository.delete(created.id, 1);
  expect(deleted).toMatchObject({ revision: 2 });
  expect(deleted.deletedAt).not.toBeNull();
  await expect(repository.get(created.id)).resolves.toBeNull();
  await expect(
    repository.list({ tags: ["restore-test"] })
  ).resolves.toMatchObject({ items: [] });
  await expect(
    repository.get(created.id, { includeDeleted: true })
  ).resolves.toMatchObject({
    deletedAt: deleted.deletedAt,
  });

  const restored = await repository.restore(created.id);
  expect(restored).toMatchObject({ deletedAt: null, revision: 3 });
  await expect(repository.get(created.id)).resolves.toMatchObject({
    deletedAt: null,
    revision: 3,
  });
});

test("lists only public tags and finds adjacent achievements", async () => {
  const repository = createAchievementRepository(env.DB);
  const testRun = crypto.randomUUID().slice(0, 8);
  const offset = Number.parseInt(crypto.randomUUID().slice(0, 8), 16) % 30_000;
  const baseDate = Date.UTC(2100, 0, 1) + offset * 24 * 60 * 60 * 1000;
  const dateAt = (day: number) =>
    new Date(baseDate + day * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const older = await repository.create({
    occurredAt: dateAt(0),
    summary: "Older entry.",
    tags: [`${testRun}-zebra`, `${testRun}-shared`],
    title: "Older entry",
  });
  const current = await repository.create({
    occurredAt: dateAt(1),
    summary: "Current entry.",
    tags: [`${testRun}-shared`, `${testRun}-alpha`],
    title: "Current entry",
  });
  const newerFirst = await repository.create({
    occurredAt: dateAt(2),
    summary: "Newer first entry.",
    tags: [`${testRun}-newer`],
    title: "Newer first entry",
  });
  const newerSecond = await repository.create({
    occurredAt: dateAt(2),
    summary: "Newer second entry.",
    tags: [`${testRun}-newer`],
    title: "Newer second entry",
  });
  const deleted = await repository.create({
    occurredAt: dateAt(3),
    summary: "Deleted entry.",
    tags: [`${testRun}-hidden`],
    title: "Deleted entry",
  });
  await repository.delete(deleted.id, 1);

  const tags = await repository.listTags();
  expect(tags).toEqual(
    expect.arrayContaining([
      { name: `${testRun}-alpha`, normalized: `${testRun}-alpha` },
      { name: `${testRun}-shared`, normalized: `${testRun}-shared` },
      { name: `${testRun}-zebra`, normalized: `${testRun}-zebra` },
    ])
  );
  expect(tags.map(({ normalized }) => normalized)).not.toContain(
    `${testRun}-hidden`
  );
  const [lastInNewerDate] = [newerFirst, newerSecond].sort((left, right) =>
    right.id.localeCompare(left.id)
  );
  await expect(repository.getAdjacent(current.id)).resolves.toMatchObject({
    next: { id: older.id },
    previous: { id: lastInNewerDate.id },
  });
  await expect(repository.getAdjacent(older.id)).resolves.toMatchObject({
    previous: { id: current.id },
  });
});
