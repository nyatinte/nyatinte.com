import { canonicalSiteUrl, siteIdentity } from "./constants";

export function buildLlmsTxt() {
  return [
    `# ${siteIdentity.name}`,
    "",
    `> ${siteIdentity.description}`,
    "",
    "## Pages",
    "",
    `- [Home](${canonicalSiteUrl("/")}): ${siteIdentity.description}`,
    `- [やったこと](${canonicalSiteUrl("/done")}): 実績の一覧`,
    `- [Sitemap](${canonicalSiteUrl("/sitemap.xml")}): 公開 URL の一覧`,
    "",
  ].join("\n");
}
