import { error } from "@sveltejs/kit";
import { renderMarkdown } from "../../../lib/server/achievement/markdown";
import { createAchievementRepository } from "../../../lib/server/achievement/repository";
import { canonicalSiteUrl } from "../../../lib/server/agent-ready/constants";
import { createBlogPostingJsonLd } from "../../../lib/server/agent-ready/json-ld";
import ogImage from "../../og.png";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const repository = createAchievementRepository();
  const entry = await repository.get(params.slug, { includeDeleted: true });
  if (!entry) {
    error(404, "実績が見つかりません。", { code: "NOT_FOUND" });
  }
  if (entry.deletedAt) {
    error(410, "この実績は削除されています。", { code: "GONE" });
  }

  const adjacent = await repository.getAdjacent(entry.id);
  const canonicalUrl = canonicalSiteUrl(
    `/done/${encodeURIComponent(entry.slug)}`
  );
  const ogImageUrl = new URL(ogImage, canonicalSiteUrl("/"));

  return {
    bodyHtml: renderMarkdown(entry.bodyMarkdown ?? ""),
    canonicalUrl,
    entry,
    jsonLd: createBlogPostingJsonLd(entry),
    next: adjacent.next,
    ogImageUrl: ogImageUrl.href,
    previous: adjacent.previous,
  };
};
