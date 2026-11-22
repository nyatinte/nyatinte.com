import { create, insert, saveBinarySync } from "zbsearch";
import { loadArticlesFromDirectory } from "../log/directory";
import { extractPlainText } from "./zb-extract";
import { createCaseInsensitiveJapaneseTokenizer, ZB_SCHEMA } from "./zb-schema";

export function buildZbSearchIndex(directory: string) {
  const articles = loadArticlesFromDirectory(directory);
  if (articles.length === 0) {
    throw new Error(`No articles found in ${directory}`);
  }
  const slugs = new Set<string>();
  const db = create({
    components: { tokenizer: createCaseInsensitiveJapaneseTokenizer() },
    schema: ZB_SCHEMA,
  });
  for (const article of articles) {
    if (slugs.has(article.slug)) {
      throw new Error(`Duplicate article slug: ${article.slug}`);
    }
    slugs.add(article.slug);
    const content = extractPlainText(article.body);
    if (!(article.title.trim() && article.description.trim() && content)) {
      throw new Error(
        `${article.slug}: title, description, and content are required`
      );
    }
    const id = insert(db, {
      content,
      description: article.description,
      id: article.slug,
      title: article.title,
      url: `/log/${article.slug}`,
    });
    if (typeof id !== "string") {
      throw new Error(
        `ZBSearch insert returned an async id for ${article.slug}`
      );
    }
  }
  return { bytes: saveBinarySync(db), recordCount: articles.length };
}
