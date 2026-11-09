import { error } from "@sveltejs/kit";
import { renderMarkdown } from "../../../lib/server/achievement/markdown";
import { createAchievementRepository } from "../../../lib/server/achievement/repository";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  const repository = createAchievementRepository();
  const entry = await repository.get(params.slug, { includeDeleted: true });
  if (!entry) {
    error(404, "実績が見つかりません。", { code: "NOT_FOUND" });
  }
  if (entry.deletedAt) {
    error(410, "この実績は削除されています。", { code: "GONE" });
  }

  const adjacent = await repository.getAdjacent(entry.id);
  const canonicalUrl = new URL(
    `/done/${encodeURIComponent(entry.slug)}`,
    url.origin
  );
  const ogImageUrl = new URL("/og/done.png", url.origin);

  return {
    bodyHtml: renderMarkdown(entry.bodyMarkdown ?? ""),
    canonicalUrl: canonicalUrl.href,
    entry,
    next: adjacent.next,
    ogImageUrl: ogImageUrl.href,
    previous: adjacent.previous,
  };
};
