import { expect, test } from "vite-plus/test";
import { legacyDoneLocation } from "./legacy-redirect";

test("旧実績 URLの場合に/log を返し無関係な URL は対象外にする", () => {
  // Given: 旧実績 URL
  // When: 転送先を調べると
  // Then
  expect(legacyDoneLocation("/done")).toBe("/log");
  expect(legacyDoneLocation("/done/old-slug")).toBe("/log");
  expect(legacyDoneLocation("/done/")).toBe("/log");
  expect(legacyDoneLocation("/donor")).toBeNull();
  expect(legacyDoneLocation("/log")).toBeNull();
});
