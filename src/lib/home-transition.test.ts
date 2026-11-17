import { expect, test } from "vite-plus/test";
import { homeTransitionDirection } from "./home-transition";

test("Given トップページと別ページの間を移動するとき、When 遷移方向を判定すると、Then in または out を返す", () => {
  for (const path of [
    "/log",
    "/log/",
    "/log/template",
    "/log/template/",
    "/nope",
  ]) {
    expect(homeTransitionDirection("/", path)).toBe("out");
    expect(homeTransitionDirection(path, "/")).toBe("in");
  }
});

test("Given 遷移元と遷移先の片方だけがトップページでないとき、When 遷移方向を判定すると、Then null を返す", () => {
  expect(homeTransitionDirection("/", "/")).toBeNull();
  expect(homeTransitionDirection("/log", "/log/template")).toBeNull();
  expect(homeTransitionDirection("/log", "/log")).toBeNull();
  expect(homeTransitionDirection("", "/")).toBeNull();
  expect(homeTransitionDirection("/", "")).toBeNull();
  expect(homeTransitionDirection("", "/log")).toBeNull();
  expect(homeTransitionDirection("/log", "")).toBeNull();
});
