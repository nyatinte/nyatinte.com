import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { load } from "./+page.server";

const fixtures = vi.hoisted(() => ({
  entry: {
    bodyMarkdown: null,
    coverImageUrl: "https://images.example.test/cover.png",
    createdAt: "2026-09-28T00:00:00.000Z",
    deletedAt: null,
    id: "01998f36-8980-7a64-bd0d-70bb30c7d901",
    links: [],
    occurredAt: "2026-09-28",
    publishedAt: "2026-09-28T00:00:00.000Z",
    revision: 2,
    slug: "one-record",
    summary: "一言の説明",
    tags: [],
    title: "実績のタイトル",
    updatedAt: "2026-09-28T00:00:00.000Z",
  },
  get: vi.fn(),
  getAdjacent: vi.fn(),
}));

vi.mock("../../../lib/server/achievement/repository", () => ({
  createAchievementRepository: () => ({
    get: fixtures.get,
    getAdjacent: fixtures.getAdjacent,
  }),
}));

describe("achievement page metadata data", () => {
  beforeEach(() => {
    fixtures.get.mockResolvedValue(fixtures.entry);
    fixtures.getAdjacent.mockResolvedValue({ next: null, previous: null });
  });

  it("uses the common static image instead of a per-achievement image URL", async () => {
    const event = {
      params: { slug: fixtures.entry.slug },
      platform: { env: { DB: {} } },
      url: new URL(`https://nyatinte.com/done/${fixtures.entry.slug}`),
    } as unknown as Parameters<typeof load>[0];

    const data = await load(event);

    expect(data).toMatchObject({
      ogImageUrl: "https://nyatinte.com/og/done.png",
    });
  });
});
