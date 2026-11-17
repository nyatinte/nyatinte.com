import { expect, test } from "vite-plus/test";
import { legacyDoneLocation } from "./legacy-redirect";

test("Given 旧実績 URL、When 転送先を調べると、Then /log を返し無関係な URL は対象外にする", () => {
  expect(legacyDoneLocation("/done")).toBe("/log");
  expect(legacyDoneLocation("/done/old-slug")).toBe("/log");
  expect(legacyDoneLocation("/done/")).toBe("/log");
  expect(legacyDoneLocation("/donor")).toBeNull();
  expect(legacyDoneLocation("/log")).toBeNull();
});
