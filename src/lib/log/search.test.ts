import { expect, test } from "vite-plus/test";
import { normalizeSearchText, searchArticles, searchTerms } from "./search";

const articles = [
  {
    date: "2026-11-18",
    description: "AI時代におけるキャッチアップについて（思想）",
    slug: "stay-light-in-ai-era",
    title: "大 AI 時代だからこそ身軽になれ",
  },
  {
    date: "2026-11-17",
    description: "なんで Computer Use じゃダメなんですか",
    slug: "cua-computer-use",
    title: "Cua がなぜ流行っているのか？",
  },
  {
    date: "2026-11-12",
    description: "ログの記事の雛形になる。",
    slug: "template",
    title: "わからなかったことを調べて書く",
  },
];

test("normalizes case and full-width latin letters", () => {
  expect(normalizeSearchText("Ｃｕａ")).toBe("cua");
  expect(normalizeSearchText("ＣＵＡ")).toBe("cua");
  expect(normalizeSearchText("大　AI")).toBe("大 ai");
});

test("splits a query on half-width and full-width spaces", () => {
  expect(searchTerms("  Cua   Computer ")).toEqual(["cua", "computer"]);
  expect(searchTerms("大　AI")).toEqual(["大", "ai"]);
  expect(searchTerms("　 ")).toEqual([]);
});

test("returns every article in order when the query is blank", () => {
  expect(searchArticles(articles, "")).toEqual(articles);
  expect(searchArticles(articles, "　 ")).toEqual(articles);
});

test("matches the title, description, and slug", () => {
  expect(searchArticles(articles, "身軽").map(({ slug }) => slug)).toEqual([
    "stay-light-in-ai-era",
  ]);
  expect(searchArticles(articles, "Computer").map(({ slug }) => slug)).toEqual([
    "cua-computer-use",
  ]);
  expect(searchArticles(articles, "template").map(({ slug }) => slug)).toEqual([
    "template",
  ]);
});

test("matches without caring about case or width", () => {
  expect(searchArticles(articles, "ｃｕａ").map(({ slug }) => slug)).toEqual([
    "cua-computer-use",
  ]);
  expect(searchArticles(articles, "cua").map(({ slug }) => slug)).toEqual([
    "cua-computer-use",
  ]);
});

test("requires every term to match the same article", () => {
  expect(searchArticles(articles, "cua computer")).toHaveLength(1);
  expect(searchArticles(articles, "cua 身軽")).toHaveLength(0);
});

test("returns nothing when no article matches", () => {
  expect(searchArticles(articles, "存在しないキーワード")).toEqual([]);
});

test("keeps the order of the given articles", () => {
  const input = [articles[2], articles[0], articles[1]];
  expect(searchArticles(input, "a").map(({ slug }) => slug)).toEqual([
    "template",
    "stay-light-in-ai-era",
    "cua-computer-use",
  ]);
});
