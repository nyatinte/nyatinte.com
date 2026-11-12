import { articles } from "../../log/articles";
import { logDescription, logTitle } from "../../log/constants";
import { canonicalSiteUrl, siteIdentity } from "./constants";

function markdownLabel(label: string) {
  return label.replaceAll("]", "\\]");
}

export function buildLlmsTxt() {
  const lines = [
    `# ${siteIdentity.name}`,
    "",
    `> ${siteIdentity.description}`,
    "",
    "## Pages",
    "",
    `- [Home](${canonicalSiteUrl("/")}): ${siteIdentity.description}`,
    `- [${logTitle}](${canonicalSiteUrl("/log")}): ${logDescription}`,
    `- [Sitemap](${canonicalSiteUrl("/sitemap.xml")}): 公開 URL の一覧`,
    `- [RSS](${canonicalSiteUrl("/log/rss.xml")}): ログの更新フィード`,
    "",
  ];
  if (articles.length > 0) {
    lines.push("## Articles", "");
    for (const article of articles) {
      lines.push(
        `- [${markdownLabel(article.title)}](${canonicalSiteUrl(`/log/${article.slug}`)}): ${article.description}`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}
