import { error } from "@sveltejs/kit";
import { createAchievementRepository } from "../../lib/server/achievement/repository";
import { normalizeTag } from "../../lib/server/achievement/validation";
import { canonicalSiteUrl } from "../../lib/server/agent-ready/constants";
import ogImage from "../og.png";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const selectedTags = [
    ...new Set(
      url.searchParams.getAll("tag").map(normalizeTag).filter(Boolean)
    ),
  ].slice(0, 20);
  const repository = createAchievementRepository();

  try {
    const [page, tags] = await Promise.all([
      repository.list({
        cursor: url.searchParams.get("cursor") ?? undefined,
        limit: 20,
        tags: selectedTags,
      }),
      repository.listTags(),
    ]);

    return {
      availableTags: tags,
      canonicalUrl: canonicalSiteUrl("/done"),
      items: page.items,
      nextCursor: page.nextCursor,
      ogImageUrl: new URL(ogImage, canonicalSiteUrl("/")).href,
      selectedTags,
    };
  } catch (cause) {
    if (cause instanceof TypeError || cause instanceof RangeError) {
      error(400, "一覧の指定が正しくありません。");
    }
    throw cause;
  }
};
