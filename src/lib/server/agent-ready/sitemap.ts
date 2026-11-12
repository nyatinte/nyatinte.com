import { createAchievementRepository } from "../achievement/repository";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlEntry(origin: string, pathname: string) {
  const location = new URL(pathname, origin).href;
  return `  <url><loc>${escapeXml(location)}</loc></url>`;
}

async function collectAchievementSlugs(
  repository: ReturnType<typeof createAchievementRepository>,
  cursor: string | undefined,
  slugs: string[]
): Promise<string[]> {
  const page = await repository.list({
    cursor,
    includeDeleted: false,
    limit: 100,
  });
  slugs.push(...page.items.map((item) => item.slug));
  return page.nextCursor
    ? collectAchievementSlugs(repository, page.nextCursor, slugs)
    : slugs;
}

export async function buildSitemapXml(origin: string): Promise<string> {
  const repository = createAchievementRepository();
  const achievementSlugs = await collectAchievementSlugs(
    repository,
    undefined,
    []
  );
  const urls = [
    urlEntry(origin, "/"),
    urlEntry(origin, "/done"),
    ...achievementSlugs.map((slug) => urlEntry(origin, `/done/${slug}`)),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}
