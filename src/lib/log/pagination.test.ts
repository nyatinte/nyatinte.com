import { expect, test } from "vite-plus/test";
import {
  logPageCount,
  logPageHref,
  logPageTitle,
  paginateArticles,
  paginationItems,
  parseLogPageParam,
} from "./pagination";

test.each([
  [null, { kind: "absent" }],
  ["1", { kind: "page", page: 1 }],
  ["2", { kind: "page", page: 2 }],
  ["99", { kind: "page", page: 99 }],
])("reads the page parameter %s", (value, expected) => {
  expect(parseLogPageParam(value)).toEqual(expected);
});

test.each(["", "0", "-1", "1.5", "01", "abc", " 2 ", "9007199254740992"])(
  "rejects the page parameter %s",
  (value) => {
    expect(parseLogPageParam(value)).toEqual({ kind: "invalid" });
  }
);

test("counts at least one page even without articles", () => {
  expect(logPageCount(0)).toBe(1);
  expect(logPageCount(1)).toBe(1);
  expect(logPageCount(10)).toBe(1);
  expect(logPageCount(11)).toBe(2);
  expect(logPageCount(20)).toBe(2);
  expect(logPageCount(21)).toBe(3);
});

test("slices articles around page boundaries", () => {
  const articles = Array.from({ length: 11 }, (_, index) => `article-${index}`);
  expect(paginateArticles(articles, 1, 5)).toEqual([
    "article-0",
    "article-1",
    "article-2",
    "article-3",
    "article-4",
  ]);
  expect(paginateArticles(articles, 2, 5)).toEqual([
    "article-5",
    "article-6",
    "article-7",
    "article-8",
    "article-9",
  ]);
  expect(paginateArticles(articles, 3, 5)).toEqual(["article-10"]);
  expect(paginateArticles(articles, 4, 5)).toEqual([]);
  expect(paginateArticles([], 1)).toEqual([]);
});

test("links the first page without a query parameter", () => {
  expect(logPageHref(1)).toBe("/log");
  expect(logPageHref(2)).toBe("/log?page=2");
  expect(logPageHref(12)).toBe("/log?page=12");
});

test("lists every page when there are seven pages or fewer", () => {
  expect(paginationItems(1, 1)).toEqual([1]);
  expect(paginationItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
});

test("collapses distant pages with ellipses", () => {
  expect(paginationItems(1, 8)).toEqual([1, 2, "ellipsis", 8]);
  expect(paginationItems(4, 8)).toEqual([
    1,
    "ellipsis",
    3,
    4,
    5,
    "ellipsis",
    8,
  ]);
  expect(paginationItems(8, 8)).toEqual([1, "ellipsis", 7, 8]);
});

test("keeps the current page in the list for every valid page", () => {
  for (let currentPage = 1; currentPage <= 20; currentPage += 1) {
    expect(paginationItems(currentPage, 20)).toContain(currentPage);
  }
});

test("builds the page title for the first page and later pages", () => {
  expect(logPageTitle(1)).toBe("ログ | nyatinte.com");
  expect(logPageTitle(2)).toBe("ログ（2ページ目） | nyatinte.com");
  expect(logPageTitle(12)).toBe("ログ（12ページ目） | nyatinte.com");
});

test("shows a second page even when the site has one page of articles", () => {
  const articles = Array.from({ length: 11 }, (_, index) => `article-${index}`);
  const totalPages = logPageCount(articles.length);

  expect(totalPages).toBe(2);
  expect(paginateArticles(articles, 1)).toHaveLength(10);
  expect(paginateArticles(articles, 2)).toEqual(["article-10"]);
  expect(paginationItems(2, totalPages)).toEqual([1, 2]);
  expect(logPageHref(2)).toBe("/log?page=2");
});
