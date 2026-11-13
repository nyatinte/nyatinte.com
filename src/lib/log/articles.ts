import { articlesFromSources } from "./frontmatter";

export type { Article } from "./frontmatter";

const rawFiles = import.meta.glob<string>("../../content/log/*.{md,svx}", {
  eager: true,
  import: "default",
  query: "?raw",
});

export const articles = articlesFromSources(rawFiles);

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
