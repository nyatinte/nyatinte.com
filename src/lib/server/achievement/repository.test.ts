import { expect, test, vi } from "vite-plus/test";
import { type AchievementRecord, parseRecord } from "./records";
import { createAchievementRepository } from "./repository";

function fakeStore() {
  let main: { record: AchievementRecord; sha: string }[] = [];
  let previous: AchievementRecord[] = [];
  let proposed: AchievementRecord | undefined;
  const store = {
    history: vi.fn(() => Promise.resolve(previous)),
    list: vi.fn(() => Promise.resolve(main)),
    propose: vi.fn((_record: AchievementRecord, content: string) => {
      proposed = parseRecord(content);
      return Promise.resolve(
        "https://github.com/nyatinte/nyatinte.com/pull/123"
      );
    }),
  };
  function merge() {
    if (!proposed) {
      throw new Error("No proposal");
    }
    previous = main
      .filter(({ record }) => record.id === proposed?.id)
      .map(({ record }) => record);
    main = [
      ...main.filter(({ record }) => record.id !== proposed?.id),
      { record: proposed, sha: `sha-${proposed.revision}` },
    ];
    proposed = undefined;
  }
  return { merge, store };
}

test("changes are proposed via PR and become visible only after merge", async () => {
  const { store, merge } = fakeStore();
  const repository = createAchievementRepository({ store });
  const created = await repository.create({
    occurredAt: "2026-01-01",
    summary: "概要",
    tags: ["Ｇｉｔ", "git"],
    title: "記録",
  });
  expect(created).toMatchObject({
    pullRequestUrl: expect.stringContaining("/pull/"),
    revision: 1,
  });
  expect((await repository.list()).items).toEqual([]);
  merge();
  expect((await repository.list({ tags: ["GIT"] })).items).toMatchObject([
    { id: created.id, tags: [{ name: "Git", normalized: "git" }] },
  ]);
  const updated = await repository.update(created.id, 1, { summary: "変更" });
  expect(updated.revision).toBe(2);
  expect(store.propose).toHaveBeenLastCalledWith(
    expect.objectContaining({ revision: 2 }),
    expect.any(String),
    "sha-1"
  );
  merge();
  await expect(
    repository.update(created.id, 1, { summary: "stale" })
  ).rejects.toMatchObject({ name: "RevisionConflictError" });
  const deleted = await repository.delete(created.id, 2);
  expect(deleted.deletedAt).toBeTruthy();
  merge();
  expect(await repository.get(created.id)).toBeNull();
  expect(
    await repository.get(created.id, { includeDeleted: true })
  ).toMatchObject({ revision: 3 });
  const restored = await repository.restore(created.id);
  expect(restored).toMatchObject({
    deletedAt: null,
    revision: 4,
    summary: "変更",
  });
});
