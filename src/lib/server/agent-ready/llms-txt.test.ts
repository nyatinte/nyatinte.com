import { expect, test } from "vite-plus/test";
import { canonicalSiteUrl, siteIdentity } from "./constants";
import { buildLlmsTxt } from "./llms-txt";

test("buildLlmsTxt lists the log and its articles", () => {
  const body = buildLlmsTxt();
  expect(body.startsWith(`# ${siteIdentity.name}\n`)).toBe(true);
  expect(body).toContain(`> ${siteIdentity.description}`);
  expect(body).toContain("## Pages");
  expect(body).toContain("## Articles");
  expect(body).toContain(`(${canonicalSiteUrl("/")})`);
  expect(body).toContain(`(${canonicalSiteUrl("/log")})`);
  expect(body).toContain(`(${canonicalSiteUrl("/log/template")})`);
  expect(body).toContain(`(${canonicalSiteUrl("/log/rss.xml")})`);
  expect(body).toContain(`(${canonicalSiteUrl("/sitemap.xml")})`);
});
