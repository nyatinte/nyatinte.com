import { articles } from "../../lib/log/articles";
import { resolveArticleImage } from "../../lib/log/og-image";
import { canonicalSiteUrl } from "../../lib/server/agent-ready/constants";
import { createLogJsonLd } from "../../lib/server/agent-ready/json-ld";
import { resolvePageOgImage } from "../../lib/server/og-image";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = () => ({
  articles: articles.map((article) => ({
    date: article.date,
    description: article.description,
    slug: article.slug,
    title: article.title,
  })),
  canonicalUrl: canonicalSiteUrl("/log"),
  image: resolveArticleImage({ sharedUrl: resolvePageOgImage() }),
  jsonLd: createLogJsonLd(),
});
