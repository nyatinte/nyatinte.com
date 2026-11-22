import { describe, expect, it } from "vite-plus/test";
import {
  backToTopScrollBehavior,
  backToTopThreshold,
  shouldShowBackToTop,
} from "./back-to-top";

describe("shouldShowBackToTop", () => {
  it("hides at the top of the page", () => {
    expect(shouldShowBackToTop(0)).toBe(false);
  });
  it("hides just above the threshold", () => {
    expect(shouldShowBackToTop(backToTopThreshold - 1)).toBe(false);
  });
  it("shows at the threshold", () => {
    expect(shouldShowBackToTop(backToTopThreshold)).toBe(true);
  });
  it("shows past the threshold", () => {
    expect(shouldShowBackToTop(backToTopThreshold + 1)).toBe(true);
  });
});

describe("backToTopScrollBehavior", () => {
  it("scrolls smoothly when motion is allowed", () => {
    expect(backToTopScrollBehavior(false)).toBe("smooth");
  });
  it("jumps instantly when reduced motion is preferred", () => {
    expect(backToTopScrollBehavior(true)).toBe("instant");
  });
});
