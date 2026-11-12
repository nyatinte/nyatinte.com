import { describe, expect, it } from "vite-plus/test";
import { getTocVisibility } from "./toc-visibility";

const headingPositions = [
  { id: "one", top: 200 },
  { id: "two", top: 900 },
];

describe("getTocVisibility", () => {
  it("hides at page top before the first heading threshold", () => {
    expect(
      getTocVisibility({
        articleBottom: 1800,
        headingPositions: [
          { id: "one", top: 620 },
          { id: "two", top: 1400 },
        ],
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "", visible: false });
  });
  it("shows and activates the first heading after it crosses the threshold", () => {
    expect(
      getTocVisibility({
        articleBottom: 1800,
        headingPositions: [{ id: "one", top: 390 }],
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "one", visible: true });
  });
  it("activates the heading in the reading zone mid-article", () => {
    expect(
      getTocVisibility({
        articleBottom: 1200,
        headingPositions: [
          { id: "one", top: -500 },
          { id: "two", top: 100 },
        ],
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "two", visible: true });
  });
  it("hides after the article end", () => {
    expect(
      getTocVisibility({
        articleBottom: 300,
        headingPositions,
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "", visible: false });
  });
  it("clears active state when scrolling back to the top", () => {
    expect(
      getTocVisibility({
        articleBottom: 1800,
        headingPositions: [{ id: "one", top: 500 }],
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "", visible: false });
  });
});
