const separatorPattern = /\s+/u;

export interface SearchableArticle {
  description: string;
  slug: string;
  title: string;
}

// 全角・半角の英数や大文字・小文字の揺れを吸収する。
// NFKC は全角スペースも半角スペースに変換する。
export function normalizeSearchText(value: string) {
  return value.normalize("NFKC").toLowerCase();
}

export function searchTerms(query: string) {
  return normalizeSearchText(query).split(separatorPattern).filter(Boolean);
}

export function matchesSearchTerms(
  article: SearchableArticle,
  terms: readonly string[]
) {
  const target = normalizeSearchText(
    `${article.title}\n${article.description}\n${article.slug}`
  );
  return terms.every((term) => target.includes(term));
}

export function searchArticles<T extends SearchableArticle>(
  articles: readonly T[],
  query: string
): T[] {
  const terms = searchTerms(query);
  if (terms.length === 0) {
    return [...articles];
  }
  return articles.filter((article) => matchesSearchTerms(article, terms));
}
