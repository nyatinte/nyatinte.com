import { describe, expect, it } from "vite-plus/test";
import { getTocVisibility } from "./toc-visibility";

describe("目次の表示状態", () => {
  it("Given scrubber が非表示のとき、When 表示状態を調べると、Then 最初の見出しを active にする", () => {
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
  it("Given 最初の見出しがしきい値に達したとき、When 表示状態を調べると、Then scrubber を表示する", () => {
    expect(
      getTocVisibility({
        headingPositions: [{ id: "one", top: 390 }],
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "one", visible: true });
  });
  it("Given 見出しが読書領域にあるとき、When 表示状態を調べると、Then その見出しを active にする", () => {
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
  it("Given viewport が低いとき、When 読書領域を計算すると、Then scroll margin を最小領域にする", () => {
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
  it("Given 最後の見出しが viewport の外に出たとき、When 表示状態を調べると、Then scrubber を隠す", () => {
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
  it("Given 見出しが読書領域に達する前、When active 見出しを調べると、Then 最初の見出しを返す", () => {
    expect(
      getTocVisibility({
        headingPositions: [{ id: "one", top: 500 }],
        viewportHeight: 1000,
      })
    ).toEqual({ activeId: "one", visible: false });
  });
});
