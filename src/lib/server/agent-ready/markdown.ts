import { articles, getArticle } from "../../log/articles";
import { logDescription, logTitle } from "../../log/constants";
import { formatLogDate } from "../../log/format-date";
import type { Article } from "../../log/frontmatter";
import { canonicalSiteUrl, siteIdentity } from "./constants";
import type { AgentRoute } from "./routes";

function linkLine(label: string, href: string) {
  return `- [${label}](${href})`;
}

function markdownLabel(label: string) {
  return label.replaceAll("]", "\\]");
}

function renderHomeMarkdown(): string {
  return [
    "# nyatinte",
    "",
    siteIdentity.description,
    "",
    linkLine(logTitle, canonicalSiteUrl("/log")),
    linkLine("サイトマップ", canonicalSiteUrl("/sitemap.xml")),
  ].join("\n");
}

function renderArticleSummary(article: Article) {
  return [
    `## [${markdownLabel(article.title)}](${canonicalSiteUrl(`/log/${article.slug}`)})`,
    "",
    article.description,
    "",
    `日付: ${formatLogDate(article.date)}`,
  ].join("\n");
}

function renderLogListMarkdown(): string {
  const lines = [`# ${logTitle}`, "", logDescription, ""];
  if (articles.length === 0) {
    lines.push("記事はまだありません。");
  } else {
    lines.push(
      articles.map((article) => renderArticleSummary(article)).join("\n\n")
    );
  }
  lines.push("", linkLine("ホーム", canonicalSiteUrl("/")));
  return lines.join("\n");
}

function renderArticleMarkdown(article: Article): string {
  const lines = [
    `# ${article.title}`,
    "",
    article.description,
    "",
    `日付: ${formatLogDate(article.date)}`,
  ];
  if (article.updated) {
    lines.push(`更新日: ${formatLogDate(article.updated)}`);
  }
  const body = article.body.trim();
  if (body) {
    lines.push("", body);
  }
  lines.push(
    "",
    linkLine("ログへ", canonicalSiteUrl("/log")),
    linkLine("ホーム", canonicalSiteUrl("/"))
  );
  return lines.join("\n");
}

function renderNotFoundMarkdown(message: string): string {
  return [
    "# ページが見つかりません",
    "",
    message,
    "",
    linkLine("ホーム", canonicalSiteUrl("/")),
    linkLine(logTitle, canonicalSiteUrl("/log")),
    linkLine("サイトマップ", canonicalSiteUrl("/sitemap.xml")),
  ].join("\n");
}

export interface MarkdownRenderResult {
  body: string;
  canonicalUrl: string;
  status: number;
}

export function renderAgentMarkdown(route: AgentRoute): MarkdownRenderResult {
  const canonicalUrl = canonicalSiteUrl(route.canonicalPath);
  if (route.kind === "home") {
    return { body: renderHomeMarkdown(), canonicalUrl, status: 200 };
  }
  if (route.kind === "log-list") {
    return { body: renderLogListMarkdown(), canonicalUrl, status: 200 };
  }
  if (route.kind === "not-found") {
    return {
      body: renderNotFoundMarkdown("ページが見つかりません。"),
      canonicalUrl,
      status: 404,
    };
  }
  const article = getArticle(route.slug);
  if (!article) {
    return {
      body: renderNotFoundMarkdown("記事が見つかりません。"),
      canonicalUrl,
      status: 404,
    };
  }
  return {
    body: renderArticleMarkdown(article),
    canonicalUrl,
    status: 200,
  };
}
