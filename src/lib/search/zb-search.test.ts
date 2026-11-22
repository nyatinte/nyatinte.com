import { expect, test } from "vite-plus/test";
import { create, loadBinarySync, search } from "zbsearch";
import { loadArticlesFromDirectory } from "../log/directory";
import { buildZbSearchIndex } from "./zb-build";
import { excerptSegments, extractPlainText } from "./zb-extract";
import {
  createCaseInsensitiveJapaneseTokenizer,
  ZB_SCHEMA,
  ZB_SEARCH_PROPERTIES,
} from "./zb-schema";

const articles = loadArticlesFromDirectory("src/content/log");
const index = buildZbSearchIndex("src/content/log");
const database = create({
  components: { tokenizer: createCaseInsensitiveJapaneseTokenizer() },
  schema: ZB_SCHEMA,
});
loadBinarySync(database, index.bytes);

async function hits(query: string) {
  const result = await search(database, {
    limit: 10,
    properties: [...ZB_SEARCH_PROPERTIES],
    term: query,
    threshold: 0,
  });
  return result.hits;
}

function slugs(query: string) {
  return hits(query).then((results) => results.map((hit) => hit.id).sort());
}

function articleBody(slug: string) {
  return articles.find((article) => article.slug === slug)?.body ?? "";
}

test("extracted article text drops Svelte blocks and CSS but keeps prose", () => {
  const stay = extractPlainText(articleBody("stay-light-in-ai-era"));
  const cua = extractPlainText(articleBody("cua-computer-use"));

  for (const text of [stay, cua]) {
    expect(text).not.toContain("<style");
    expect(text).not.toContain("<script");
    expect(text).not.toContain("XPostCard");
    expect(text).not.toContain("border-radius");
    expect(text).not.toContain("import ");
  }
  expect(stay).toContain("AI をはじめとした技術の進化が");
  expect(cua).toContain("デスクトップ操作");
});

test("the binary index round-trips and matches Latin terms case-insensitively", async () => {
  expect(index.recordCount).toBe(articles.length);
  expect(index.bytes.byteLength).toBeGreaterThan(0);
  expect(await slugs("Bot")).toEqual([
    "cua-computer-use",
    "stay-light-in-ai-era",
  ]);
  expect(await slugs("bot")).toEqual([
    "cua-computer-use",
    "stay-light-in-ai-era",
  ]);
});

test("search results keep the original title casing", async () => {
  const [hit] = await hits("Cua");
  expect(hit.document.title).toBe("Cua がなぜ流行っているのか？");
});

test("url-only slug terms do not match article text", async () => {
  expect(await slugs("stay-light-in-ai-era")).toEqual([]);
});

test("the template article is searchable through frontmatter, MDX, and paths", async () => {
  expect(await slugs("frontmatter")).toEqual(["template"]);
  expect(await slugs("MDX")).toEqual(["template"]);
  expect(await slugs("src/content/log")).toEqual(["template"]);
});

test("negative, UI-chrome, SVX, and CSS queries return no hits", async () => {
  const queries = [
    "qwzx",
    "存在しない語",
    "accessibility",
    "Cuaa",
    "テレポート",
    "XPostCard",
    "border-radius",
    "Markdown をコピー",
  ];
  const matches = await Promise.all(queries.map((term) => slugs(term)));
  for (const [position, term] of queries.entries()) {
    expect(matches[position], term).toEqual([]);
  }
});

test("excerpts mark the matching term inside a short content window", () => {
  const segments = excerptSegments(
    "Computer Use などは以前からある概念なので、Cua の何が差別化点なのか。",
    "Cua"
  );
  const marked = segments.filter((segment) => segment.mark);
  expect(marked.length).toBeGreaterThan(0);
  expect(
    marked
      .map((segment) => segment.text)
      .join("")
      .toLowerCase()
  ).toBe("cua");
  expect(segments.map((segment) => segment.text).join("")).toContain(
    "Computer Use"
  );
});
