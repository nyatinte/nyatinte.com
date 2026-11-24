import { describe, expect, it } from "vite-plus/test";
import { shouldCountFall } from "./respawn";

describe("shouldCountFall", () => {
  it("counts only a kill-plane fall", () => {
    expect(shouldCountFall("fall")).toBe(true);
    expect(shouldCountFall("manual")).toBe(false);
  });
});
