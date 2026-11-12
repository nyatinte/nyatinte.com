import {
  canonicalSiteUrl,
  siteIdentity,
} from "../server/agent-ready/constants";
import { logDescription, logTitle } from "./constants";
import { rssDate } from "./format-date";
import type { Article } from "./frontmatter";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function itemXml(article: Article) {
  const link = canonicalSiteUrl(`/log/${article.slug}`);
  return [
    "    <item>",
    `      <title>${escapeXml(article.title)}</title>`,
    `      <link>${escapeXml(link)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
    `      <pubDate>${escapeXml(rssDate(article.date))}</pubDate>`,
    `      <description>${escapeXml(article.description)}</description>`,
    "    </item>",
  ].join("\n");
}

export function buildRssXml(items: Article[]) {
  const link = canonicalSiteUrl("/log");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(`${logTitle} | ${siteIdentity.name}`)}</title>`,
    `    <link>${escapeXml(link)}</link>`,
    `    <description>${escapeXml(logDescription)}</description>`,
    ...items.map((article) => itemXml(article)),
    "  </channel>",
    "</rss>",
  ].join("\n");
}
