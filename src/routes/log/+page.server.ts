import { articles } from "../../lib/log/articles";
import { resolveArticleImage } from "../../lib/log/og-image";
import { canonicalSiteUrl } from "../../lib/server/agent-ready/constants";
import { createLogJsonLd } from "../../lib/server/agent-ready/json-ld";
import ogImage from "../og.png";
import type { PageServerLoad } from "./$types";

const sharedOgImage = new URL(ogImage, canonicalSiteUrl("/")).href;

export const load: PageServerLoad = () => {
  const image = resolveArticleImage({ sharedUrl: sharedOgImage });
  return {
    articles: articles.map((article) => ({
      date: article.date,
      description: article.description,
      slug: article.slug,
      title: article.title,
      updated: article.updated ?? null,
    })),
    canonicalUrl: canonicalSiteUrl("/log"),
    image,
    jsonLd: createLogJsonLd(),
  };
};
