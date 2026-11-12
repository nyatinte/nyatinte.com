import { error } from "@sveltejs/kit";
import { getArticle } from "../../../lib/log/articles";
import { resolveArticleImage } from "../../../lib/log/og-image";
import { canonicalSiteUrl } from "../../../lib/server/agent-ready/constants";
import { createArticleJsonLd } from "../../../lib/server/agent-ready/json-ld";
import ogImage from "../../og.png";
import type { PageServerLoad } from "./$types";

const sharedOgImage = new URL(ogImage, canonicalSiteUrl("/")).href;

export const load: PageServerLoad = ({ params }) => {
  const article = getArticle(params.slug);
  if (!article) {
    error(404, "記事が見つかりません。", { code: "NOT_FOUND" });
  }
  const image = resolveArticleImage({
    image: article.image,
    sharedUrl: sharedOgImage,
    title: article.title,
  });
  return {
    article,
    canonicalUrl: canonicalSiteUrl(`/log/${article.slug}`),
    image,
    jsonLd: createArticleJsonLd(article),
  };
};
