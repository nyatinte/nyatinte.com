import { expect, test } from "vite-plus/test";
import {
  articleDateTransitionName,
  articleTransitionName,
  shouldStartArticleTransition,
} from "./view-transition";

test("Given ログ一覧と記事の間を移動するとき、When 遷移可否を判定すると、Then view transition を開始する", () => {
  expect(shouldStartArticleTransition("/log", "/log/template")).toBe(true);
  expect(shouldStartArticleTransition("/log/", "/log/template/")).toBe(true);
  expect(shouldStartArticleTransition("/log/", "/log/template")).toBe(true);
  expect(shouldStartArticleTransition("/log/template", "/log")).toBe(true);
  expect(shouldStartArticleTransition("/log/template/", "/log/")).toBe(true);
  expect(shouldStartArticleTransition("/", "/log/template")).toBe(false);
  expect(shouldStartArticleTransition("/log", "/log/rss.xml")).toBe(false);
  expect(shouldStartArticleTransition("/log", "/log")).toBe(false);
});

test("Given 記事の slug、When view transition 名を作ると、Then CSS identifier として有効な prefix を付ける", () => {
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
