import {
  canonicalSiteUrl,
  siteIdentity,
} from "../server/agent-ready/constants";
import { escapeXml } from "../xml";
import { logDescription, logRssUrl, logTitle } from "./constants";
import { rssDate } from "./format-date";
import type { Article } from "./frontmatter";

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

function latestUpdatedDate(items: Article[]) {
  return items.reduce((latest, item) => {
    const candidate = item.updated ?? item.date;
    return candidate > latest ? candidate : latest;
  }, "");
}

export function buildRssXml(items: Article[]) {
  const link = canonicalSiteUrl("/log");
  const lastBuildDate = latestUpdatedDate(items);
  const channel = [
    `    <title>${escapeXml(`${logTitle} | ${siteIdentity.name}`)}</title>`,
    `    <link>${escapeXml(link)}</link>`,
    `    <description>${escapeXml(logDescription)}</description>`,
    `    <language>${escapeXml(siteIdentity.inLanguage)}</language>`,
    `    <atom:link href="${escapeXml(logRssUrl)}" rel="self" type="application/rss+xml" />`,
  ];
  if (lastBuildDate) {
    channel.push(
      `    <lastBuildDate>${escapeXml(rssDate(lastBuildDate))}</lastBuildDate>`
    );
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    ...channel,
    ...items.map((article) => itemXml(article)),
    "  </channel>",
    "</rss>",
  ].join("\n");
}
