import { type Dirent, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  assertArticleBodyImages,
  localArticleImagePaths,
} from "./article-images";
import { articlesFromSources } from "./frontmatter";

export function loadArticlesFromDirectory(directory: string) {
  let entries: Array<Dirent>;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    throw new Error(`Article directory is missing: ${directory}`, {
      cause: error,
    });
  }
  const sources: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    if (!entry.isDirectory()) {
      throw new Error(`Expected an article directory: ${entry.name}`);
    }
    const files = readdirSync(join(directory, entry.name));
    const articles = files.filter(
      (name) => name === "index.md" || name === "index.svx",
    );
    if (articles.length === 0) {
      throw new Error(`${entry.name}: missing index.md or index.svx`);
    }
    for (const name of articles) {
      sources[`${entry.name}/${name}`] = readFileSync(
        join(directory, entry.name, name),
        "utf8",
      );
    }
  }
  const articles = articlesFromSources(sources);
  for (const article of articles) {
    assertArticleBodyImages(article.slug, article.body);
    const images = [
      ...(article.image?.startsWith("./") ? [article.image] : []),
      ...localArticleImagePaths(article.body),
    ];
    for (const image of images) {
      const path = join(directory, article.slug, image.slice(2));
      try {
        if (!statSync(path).isFile()) {
          throw new Error("Not a file");
        }
      } catch (error) {
        throw new Error(`${article.slug}: image not found: ${image}`, {
          cause: error,
        });
      }
    }
  }
  return articles;
}
