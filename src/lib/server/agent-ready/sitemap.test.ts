import { expect, test } from "vite-plus/test";
import { buildSitemapXml } from "./sitemap";

test("builds a sitemap containing the log and lastmod", () => {
  const xml = buildSitemapXml();
  expect(xml).toContain("https://nyatinte.com/");
  expect(xml).toContain("https://nyatinte.com/log");
  expect(xml).toContain("https://nyatinte.com/log/template");
  expect(xml).not.toContain("https://nyatinte.com/done");
  expect(xml).toContain("<lastmod>2026-11-12</lastmod>");
  expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
});
