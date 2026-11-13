import { describe, expect, it } from "vite-plus/test";
import { getTocVisibility } from "./toc-visibility";

describe("getTocVisibility", () => {
  it("keeps the first heading active while the scrubber is hidden", () => {
    expect(
      getTocVisibility({
        headingPositions: [
          { id: "one", top: 620 },
          { id: "two", top: 1400 },
        ],
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "one", visible: false });
  });
  it("shows when the first heading reaches the threshold", () => {
    expect(
      getTocVisibility({
        headingPositions: [{ id: "one", top: 390 }],
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "one", visible: true });
  });
  it("activates the heading in the reading zone", () => {
    expect(
      getTocVisibility({
        headingPositions: [
          { id: "one", top: -500 },
          { id: "two", top: 100 },
        ],
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "two", visible: true });
  });
  it("uses scroll margin as the minimum reading zone on short viewports", () => {
    expect(
      getTocVisibility({
        headingPositions: [
          { id: "one", top: -200 },
          { id: "two", top: 96 },
        ],
        viewportHeight: 400,
      })
    ).toEqual({ activeId: "two", visible: true });
  });
  it("hides after the last heading leaves the viewport", () => {
    expect(
      getTocVisibility({
        headingPositions: [
          { id: "one", top: -100 },
          { id: "two", top: -1 },
        ],
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "two", visible: false });
  });
  it("defaults active heading to the first before it reaches the reading zone", () => {
    expect(
      getTocVisibility({
        headingPositions: [{ id: "one", top: 500 }],
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "one", visible: false });
  });
});
