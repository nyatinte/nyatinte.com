import { expect, test } from "vite-plus/test";
import { shouldStartArticleTransition } from "./view-transition";

test("starts a view transition only from the list to an article", () => {
  expect(shouldStartArticleTransition("/log", "/log/template")).toBe(true);
  expect(shouldStartArticleTransition("/log/template", "/log")).toBe(false);
  expect(shouldStartArticleTransition("/", "/log/template")).toBe(false);
  expect(shouldStartArticleTransition("/log", "/log/rss.xml")).toBe(false);
  expect(shouldStartArticleTransition("/log", "/log")).toBe(false);
});
