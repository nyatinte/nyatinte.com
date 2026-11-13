import { expect, test } from "vite-plus/test";
import {
  articleDateTransitionName,
  articleTransitionName,
  homeTransitionDirection,
  shouldStartArticleTransition,
} from "./view-transition";

test("transitions between home and the log index in both directions only", () => {
  expect(homeTransitionDirection("/", "/log")).toBe("out");
  expect(homeTransitionDirection("/log", "/")).toBe("in");
  expect(homeTransitionDirection("/", "/log/")).toBe("out");
  expect(homeTransitionDirection("/log/", "/")).toBe("in");
  expect(homeTransitionDirection("/log/article", "/")).toBeNull();
  expect(homeTransitionDirection("/", "/log/article")).toBeNull();
  expect(homeTransitionDirection("/log", "/log")).toBeNull();
});

test("starts a view transition only from the list to an article", () => {
  expect(shouldStartArticleTransition("/log", "/log/template")).toBe(true);
  expect(shouldStartArticleTransition("/log/", "/log/template/")).toBe(true);
  expect(shouldStartArticleTransition("/log/", "/log/template")).toBe(true);
  expect(shouldStartArticleTransition("/log/template", "/log")).toBe(false);
  expect(shouldStartArticleTransition("/", "/log/template")).toBe(false);
  expect(shouldStartArticleTransition("/log", "/log/rss.xml")).toBe(false);
  expect(shouldStartArticleTransition("/log", "/log")).toBe(false);
});

test("prefixes slugs so the view transition name is a CSS identifier", () => {
  expect(articleTransitionName("2026-11-12-foo")).toBe(
    "log-title-2026-11-12-foo"
  );
  expect(articleTransitionName("template")).toBe("log-title-template");
  expect(articleTransitionName("date-template")).not.toBe(
    articleDateTransitionName("template")
  );
  expect(articleDateTransitionName("2026-11-12-foo")).toBe(
    "log-date-2026-11-12-foo"
  );
  expect(articleDateTransitionName("template")).toBe("log-date-template");
});
