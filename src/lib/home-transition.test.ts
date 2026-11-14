import { expect, test } from "vite-plus/test";
import { homeTransitionDirection } from "./home-transition";

test("transitions between home and any other page", () => {
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

test("does not transition unless exactly one non-empty path is home", () => {
  expect(homeTransitionDirection("/", "/")).toBeNull();
  expect(homeTransitionDirection("/log", "/log/template")).toBeNull();
  expect(homeTransitionDirection("/log", "/log")).toBeNull();
  expect(homeTransitionDirection("", "/")).toBeNull();
  expect(homeTransitionDirection("/", "")).toBeNull();
  expect(homeTransitionDirection("", "/log")).toBeNull();
  expect(homeTransitionDirection("/log", "")).toBeNull();
});
