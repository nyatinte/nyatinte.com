import { flushSync, mount, unmount } from "svelte";
import { expect, test } from "vite-plus/test";
import DonePage from "../../src/routes/done/[slug]/+page.svelte";

function makeData(coverImageUrl: string | null) {
  return {
    bodyHtml: "",
    canonicalUrl: "https://example.test/done/test-entry",
    entry: {
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
    },
    next: null,
    ogImageUrl: coverImageUrl,
    previous: null,
  };
}

function mountPage(coverImageUrl: string | null) {
  const component = mount(DonePage, {
    props: { data: makeData(coverImageUrl) as never },
    target: document.body,
  });
  flushSync();
  return component;
}

function metaContent(selector: string) {
  return document.head.querySelector<HTMLMetaElement>(selector)?.content;
}

test("omits image metadata and uses a summary card without a cover", async () => {
  const component = mountPage(null);

  expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
  expect(document.head.querySelector('meta[property^="og:image:"]')).toBeNull();
  expect(metaContent('meta[name="twitter:card"]')).toBe("summary");

  await unmount(component);
});

test("emits image metadata and a large-image card when a cover exists", async () => {
  const coverImageUrl = "https://images.example.test/cover.png";
  const component = mountPage(coverImageUrl);

  expect(metaContent('meta[property="og:image"]')).toBe(coverImageUrl);
  expect(metaContent('meta[property="og:image:width"]')).toBe("1200");
  expect(metaContent('meta[property="og:image:height"]')).toBe("630");
  expect(metaContent('meta[property="og:image:alt"]')).toBe(
    "テスト実績 — nyatinte.com"
  );
  expect(metaContent('meta[name="twitter:card"]')).toBe("summary_large_image");

  await unmount(component);
});
