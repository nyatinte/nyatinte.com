import { error } from "@sveltejs/kit";
import { getArticle } from "../../../lib/log/articles";
import { resolveArticleImage } from "../../../lib/log/og-image";
import { extractHeadings } from "../../../lib/log/toc";
import { canonicalSiteUrl } from "../../../lib/server/agent-ready/constants";
import { createArticleJsonLd } from "../../../lib/server/agent-ready/json-ld";
import { resolvePageOgImage } from "../../../lib/server/og-image";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
  const article = getArticle(params.slug);
  if (!article) {
    error(404, "記事が見つかりません。", { code: "NOT_FOUND" });
  }
  return {
    article,
    canonicalUrl: canonicalSiteUrl(`/log/${article.slug}`),
    headings: extractHeadings(article.body),
    image: resolveArticleImage({
      image: article.image,
      sharedUrl: resolvePageOgImage(),
      title: article.title,
    }),
    jsonLd: createArticleJsonLd(article),
  };
};
