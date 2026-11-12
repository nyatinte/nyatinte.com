import { expect, test } from "vite-plus/test";
import { buildSitemapXml } from "./sitemap";

test("builds a sitemap containing core routes", async () => {
  const xml = await buildSitemapXml("https://nyatinte.com");
  expect(xml).toContain("https://nyatinte.com/");
  expect(xml).toContain("https://nyatinte.com/done");
  expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
});
