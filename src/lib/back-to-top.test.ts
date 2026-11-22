import { describe, expect, it } from "vite-plus/test";
import {
  backToTopFocusSelectors,
  backToTopScrollBehavior,
  backToTopThreshold,
  findBackToTopFocusTarget,
  shouldShowBackToTop,
} from "./back-to-top";

const wordmark = { name: "wordmark" } as unknown as HTMLElement;
const heading = { name: "heading" } as unknown as HTMLElement;

function fakeQuery(elements: Record<string, HTMLElement>) {
  return (selector: string) => elements[selector] ?? null;
}

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

describe("findBackToTopFocusTarget", () => {
  it("prefers the header wordmark over the main heading", () => {
    const query = fakeQuery({
      "header .wordmark": wordmark,
      "main h1": heading,
    });
    expect(findBackToTopFocusTarget(query)).toBe(wordmark);
  });

  it("falls back to the main heading without a header wordmark", () => {
    const query = fakeQuery({ "main h1": heading });
    expect(findBackToTopFocusTarget(query)).toBe(heading);
  });

  it("returns null when neither candidate exists", () => {
    expect(findBackToTopFocusTarget(fakeQuery({}))).toBeNull();
  });

  it("tries the candidates in priority order", () => {
    const asked: string[] = [];
    findBackToTopFocusTarget((selector) => {
      asked.push(selector);
      return null;
    });
    expect(asked).toEqual([...backToTopFocusSelectors]);
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
