import { beforeEach, expect, test, vi } from "vite-plus/test";
import type { AchievementRecord } from "../../../lib/server/achievement/repository";
import { load } from "./+page.server";

const { get, getAdjacent } = vi.hoisted(() => ({
  get: vi.fn(),
  getAdjacent: vi.fn(),
}));

vi.mock("../../../lib/server/achievement/repository", () => ({
  createAchievementRepository: () => ({ get, getAdjacent }),
}));

function makeEntry(coverImageUrl: string | null): AchievementRecord {
  return {
    bodyMarkdown: null,
    coverImageUrl,
    createdAt: "2026-09-27T00:00:00.000Z",
    deletedAt: null,
    id: "test-id",
    links: [],
    occurredAt: "2026-09-26",
    publishedAt: "2026-09-27T00:00:00.000Z",
    revision: 1,
    slug: "test-entry",
    summary: "実績の要約",
    tags: [],
    title: "テスト実績",
    updatedAt: "2026-09-27T00:00:00.000Z",
  };
}

function loadEntry(entry: AchievementRecord) {
  get.mockResolvedValue(entry);
  getAdjacent.mockResolvedValue({ next: null, previous: null });
  return load({
    params: { slug: entry.slug },
    platform: { env: { DB: {} } },
    url: new URL(`https://example.test/done/${entry.slug}`),
  } as Parameters<typeof load>[0]);
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("does not invent an OGP image URL when an achievement has no cover", async () => {
  const data = await loadEntry(makeEntry(null));

  expect(data).toHaveProperty("ogImageUrl", null);
});

test("uses the saved cover image URL for OGP metadata", async () => {
  const coverImageUrl = "https://images.example.test/cover.png";
  const data = await loadEntry(makeEntry(coverImageUrl));

  expect(data).toHaveProperty("ogImageUrl", coverImageUrl);
});
