import { createTokenizer } from "@zbsearch/tokenizers/japanese";

export const ZB_SCHEMA = {
  content: "string",
  description: "string",
  title: "string",
  url: "string",
} as const;

export const ZB_SEARCH_PROPERTIES = [
  "title",
  "description",
  "content",
] as const;

const letterDotLetter = /(?<=\p{L})\.(?=\p{L})/gu;

/**
 * Normalizes before the stock Japanese tokenizer runs so that index and query
 * tokens agree across Node and browser `Intl.Segmenter` implementations.
 *
 * NFKC folds full-width letters and digits into their ASCII forms. Letter-dot-
 * letter sequences (`Next.js`, `index.md`) become spaces because the runtimes
 * split them differently on `.`; other dots (`V4.1`, `1.5`) are kept. Lowercasing
 * the tokens at both index and query time makes `Bot` and `bot` match without
 * altering the original title, description, or content returned by the search.
 */
export function createSearchTokenizer() {
  const tokenizer = createTokenizer();
  const { tokenize } = tokenizer;
  tokenizer.tokenize = (input, language, property, withCache) =>
    tokenize(
      input.normalize("NFKC").replaceAll(letterDotLetter, " "),
      language,
      property,
      withCache,
    ).map((token) => token.toLowerCase());
  return tokenizer;
}
