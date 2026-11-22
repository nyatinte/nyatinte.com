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

/**
 * The Japanese tokenizer keeps the original case. Lowercasing the tokens at
 * both index and query time makes `Bot` and `bot` match without altering the
 * original title, description, or content returned by the search.
 */
export function createCaseInsensitiveJapaneseTokenizer() {
  const tokenizer = createTokenizer();
  const { tokenize } = tokenizer;
  tokenizer.tokenize = (input, language, property, withCache) =>
    tokenize(input, language, property, withCache).map((token) =>
      token.toLowerCase()
    );
  return tokenizer;
}
