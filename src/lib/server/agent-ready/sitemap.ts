import { articles } from "../../log/articles";
import { canonicalSiteUrl } from "./constants";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlEntry(pathname: string, lastmod: string) {
  const location = canonicalSiteUrl(pathname);
  return `  <url><loc>${escapeXml(location)}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`;
}

function newestStamp() {
  const stamps = articles.map((article) => article.updated ?? article.date);
  stamps.sort();
  return stamps.at(-1) ?? new Date().toISOString().slice(0, 10);
}

export function buildSitemapXml(): string {
  const siteLastmod = newestStamp();
  const urls = [
    urlEntry("/", siteLastmod),
    urlEntry("/log", siteLastmod),
    ...articles.map((article) =>
      urlEntry(`/log/${article.slug}`, article.updated ?? article.date)
    ),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}
