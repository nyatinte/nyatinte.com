import { type AnyZBSearch, create, loadBinary, search } from "zbsearch";
import type { SearchResponse, SearchResult } from "./types";
import { excerptSegments } from "./zb-extract";
import {
  createCaseInsensitiveJapaneseTokenizer,
  ZB_SCHEMA,
  ZB_SEARCH_PROPERTIES,
} from "./zb-schema";

interface ZbDocument {
  content: string;
  description: string;
  id: string;
  title: string;
  url: string;
}

const indexUrl = "/zbsearch/index.zbsb";
const missingCode = "MISSING_INDEX";

function missingIndexError() {
  return Object.assign(new Error("Search index is missing"), {
    code: missingCode,
  });
}

function isMissingIndex(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === missingCode
  );
}

let databasePromise: Promise<ReturnType<typeof create>> | null = null;

function loadDatabase() {
  databasePromise ??= (async () => {
    const response = await fetch(indexUrl, { cache: "no-store" });
    if (response.status === 404) {
      throw missingIndexError();
    }
    if (!response.ok) {
      throw new Error(`GET ${indexUrl} returned ${response.status}`);
    }
    const database = create({
      components: { tokenizer: createCaseInsensitiveJapaneseTokenizer() },
      schema: ZB_SCHEMA,
    });
    await loadBinary(database, new Uint8Array(await response.arrayBuffer()));
    return database;
  })().catch((error: unknown) => {
    databasePromise = null;
    throw error;
  });
  return databasePromise;
}

function toResult(document: ZbDocument, query: string): SearchResult {
  return {
    excerptSegments: excerptSegments(document.content, query),
    slug: document.id,
    title: document.title,
    url: document.url,
  };
}

export async function searchZbSearch(query: string): Promise<SearchResponse> {
  try {
    const database = await loadDatabase();
    const response = await search(database as AnyZBSearch, {
      limit: 10,
      properties: [...ZB_SEARCH_PROPERTIES],
      term: query,
      threshold: 0,
    });
    const results = response.hits.map((hit) =>
      toResult(hit.document as unknown as ZbDocument, query)
    );
    return {
      results,
      status: results.length > 0 ? "ready" : "empty",
    };
  } catch (error) {
    if (isMissingIndex(error)) {
      return {
        message: "検索インデックスを読み込めませんでした",
        results: [],
        status: "unavailable",
      };
    }
    return {
      message: "検索に失敗しました",
      results: [],
      status: "error",
    };
  }
}
