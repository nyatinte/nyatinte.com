import { expect, test } from "vite-plus/test";
import { canonicalSiteUrl, siteIdentity } from "./constants";
import { buildLlmsTxt } from "./llms-txt";

test("buildLlmsTxt follows the llms.txt structure", () => {
  const body = buildLlmsTxt();
  expect(body.startsWith(`# ${siteIdentity.name}\n`)).toBe(true);
  expect(body).toContain(`> ${siteIdentity.description}`);
  expect(body).toContain("## Pages");
  expect(body).toContain(`(${canonicalSiteUrl("/")})`);
  expect(body).toContain(`(${canonicalSiteUrl("/done")})`);
  expect(body).toContain(`(${canonicalSiteUrl("/sitemap.xml")})`);
});
