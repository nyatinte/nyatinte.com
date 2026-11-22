import { create, insert, saveBinarySync } from "zbsearch";
import { loadArticlesFromDirectory } from "../log/directory";
import { extractPlainText } from "./zb-extract";
import { createCaseInsensitiveJapaneseTokenizer, ZB_SCHEMA } from "./zb-schema";

export function buildZbSearchIndex(directory: string) {
  const articles = loadArticlesFromDirectory(directory);
  if (articles.length === 0) {
    throw new Error(`No articles in ${directory}`);
  }
  const db = create({
    components: { tokenizer: createCaseInsensitiveJapaneseTokenizer() },
    schema: ZB_SCHEMA,
  });
  for (const article of articles) {
    const content = extractPlainText(article.body);
    if (!content) {
      throw new Error(`${article.slug}: content is required`);
    }
    insert(db, {
      content,
      description: article.description,
      id: article.slug,
      title: article.title,
      url: `/log/${article.slug}`,
    });
  }
  return { bytes: saveBinarySync(db), recordCount: articles.length };
}
