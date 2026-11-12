import { expect, test } from "vite-plus/test";
import { legacyDoneLocation } from "./legacy-redirect";

test("sends former achievement URLs to the log", () => {
  expect(legacyDoneLocation("/done")).toBe("/log");
  expect(legacyDoneLocation("/done/old-slug")).toBe("/log");
  expect(legacyDoneLocation("/done/")).toBe("/log");
  expect(legacyDoneLocation("/donor")).toBeNull();
  expect(legacyDoneLocation("/log")).toBeNull();
});
