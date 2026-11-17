import { articlesFromSources } from "./frontmatter";

export type { Article } from "./frontmatter";

const rawFiles = import.meta.glob<string>(
  "../../content/log/*/index.{md,svx}",
  {
    eager: true,
    import: "default",
    query: "?raw",
  }
);

const images = import.meta.glob<string>(
  "../../content/log/*/*.{png,jpg,jpeg,webp,gif}",
  { eager: true, import: "default", query: "?url&no-inline" }
);

export const articles = articlesFromSources(rawFiles).map((article) => {
  if (!article.image?.startsWith("./")) {
    return article;
  }
  const image =
    images[`../../content/log/${article.slug}/${article.image.slice(2)}`];
  if (!image) {
    throw new Error(`${article.slug}: image not found: ${article.image}`);
  }
  return { ...article, image };
});

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
