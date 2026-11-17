import { expect, test } from "vite-plus/test";
import { buildSitemapXml } from "./sitemap";

test("公開ページの場合にログ URL と lastmod を含める", () => {
  // Given: 公開ページ
  // When: sitemap を生成すると
  const xml = buildSitemapXml();
  // Then
  expect(xml).toContain("https://nyatinte.com/");
  expect(xml).toContain("https://nyatinte.com/log");
  expect(xml).toContain("https://nyatinte.com/log/template");
  expect(xml).not.toContain("https://nyatinte.com/done");
  expect(xml).toContain("<lastmod>2026-11-12</lastmod>");
  expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
});
