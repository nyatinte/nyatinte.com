import { expect, test } from "vite-plus/test";
import { homeTransitionDirection } from "./home-transition";

test("トップページと別ページの間を移動するとき、in または out を返す", () => {
  // Given: トップページと別ページの間を移動するとき
  // When: 遷移方向を判定すると
  for (const path of [
    "/log",
    "/log/",
    "/log/template",
    "/log/template/",
    "/nope",
  ]) {
    // Then
    expect(homeTransitionDirection("/", path)).toBe("out");
    expect(homeTransitionDirection(path, "/")).toBe("in");
  }
});

test("遷移元と遷移先の片方だけがトップページでないとき、null を返す", () => {
  // Given: 遷移元と遷移先の片方だけがトップページでないとき
  // When: 遷移方向を判定すると
  // Then
  expect(homeTransitionDirection("/", "/")).toBeNull();
  expect(homeTransitionDirection("/log", "/log/template")).toBeNull();
  expect(homeTransitionDirection("/log", "/log")).toBeNull();
  expect(homeTransitionDirection("", "/")).toBeNull();
  expect(homeTransitionDirection("/", "")).toBeNull();
  expect(homeTransitionDirection("", "/log")).toBeNull();
  expect(homeTransitionDirection("/log", "")).toBeNull();
});
