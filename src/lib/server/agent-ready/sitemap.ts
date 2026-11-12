import type { AchievementRecord } from "../achievement/records";
import { createAchievementRepository } from "../achievement/repository";
import { canonicalSiteUrl } from "./constants";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function lastmodFromTimestamp(value: string) {
  return value.slice(0, 10);
}

function urlEntry(pathname: string, lastmod: string) {
  const location = canonicalSiteUrl(pathname);
  return `  <url><loc>${escapeXml(location)}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`;
}

async function collectAchievementEntries(
  repository: ReturnType<typeof createAchievementRepository>,
  cursor: string | undefined,
  entries: AchievementRecord[]
): Promise<AchievementRecord[]> {
  const page = await repository.list({
    cursor,
    includeDeleted: false,
    limit: 100,
  });
  entries.push(...page.items);
  return page.nextCursor
    ? collectAchievementEntries(repository, page.nextCursor, entries)
    : entries;
}

export async function buildSitemapXml(): Promise<string> {
  const repository = createAchievementRepository();
  const achievements = await collectAchievementEntries(
    repository,
    undefined,
    []
  );
  const siteLastmod = new Date().toISOString().slice(0, 10);
  const urls = [
    urlEntry("/", siteLastmod),
    urlEntry("/done", siteLastmod),
    ...achievements.map((entry) =>
      urlEntry(`/done/${entry.slug}`, lastmodFromTimestamp(entry.updatedAt))
    ),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}
