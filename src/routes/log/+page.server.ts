import { error, redirect } from "@sveltejs/kit";
import { articles } from "../../lib/log/articles";
import { resolveArticleImage } from "../../lib/log/og-image";
import {
  logPageCount,
  logPageHref,
  paginateArticles,
  parseLogPageParam,
} from "../../lib/log/pagination";
import { canonicalSiteUrl } from "../../lib/server/agent-ready/constants";
import { createLogJsonLd } from "../../lib/server/agent-ready/json-ld";
import { resolvePageOgImage } from "../../lib/server/og-image";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ url }) => {
  const parsedPage = parseLogPageParam(url.searchParams.get("page"));
  if (parsedPage.kind === "invalid") {
    error(404, "ページが見つかりません。", { code: "NOT_FOUND" });
  }

  if (parsedPage.kind === "page" && parsedPage.page === 1) {
    const normalized = new URL(url);
    normalized.searchParams.delete("page");
    redirect(301, `${normalized.pathname}${normalized.search}`);
  }

  const currentPage = parsedPage.kind === "page" ? parsedPage.page : 1;
  const totalPages = logPageCount(articles.length);
  if (currentPage > totalPages) {
    error(404, "ページが見つかりません。", { code: "NOT_FOUND" });
  }

  return {
    articles: paginateArticles(articles, currentPage).map((article) => ({
      date: article.date,
      description: article.description,
      slug: article.slug,
      title: article.title,
    })),
    canonicalUrl: canonicalSiteUrl(logPageHref(currentPage)),
    currentPage,
    image: resolveArticleImage({ sharedUrl: resolvePageOgImage() }),
    jsonLd: createLogJsonLd(),
    totalPages,
  };
};
