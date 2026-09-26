import { expect, test } from "vite-plus/test";
import {
  layoutTags,
  layoutText,
  measurementInputs,
  normalizeSupportedText,
  type TextLayout,
} from "./layout";

const TITLE_SIZES = [76, 68, 58, 48, 40];
const ELLIPSIS_AT_END = /…$/u;
const CLOSING_BRACKET_AT_START = /^[」』）］｝】]/u;
const OPENING_BRACKET_AT_END = /[「『（［｛【]$/u;

function measurementsFor(segments: string[], sizes: number[]) {
  return new Map(
    sizes.map((size) => [
      size,
      new Map(
        measurementInputs(segments).map((segment) => [
          segment,
          Array.from(segment).length * size,
        ])
      ),
    ])
  );
}

function layout(
  segments: string[],
  options: { maxLines: number; maxWidth: number; sizes?: number[] }
): TextLayout {
  const sizes = options.sizes ?? TITLE_SIZES;

  return layoutText(segments, {
    fontSizes: sizes,
    maxLines: options.maxLines,
    maxWidth: options.maxWidth,
    measurements: measurementsFor(segments, sizes),
  });
}

test("keeps a short title on one line at the largest planned size", () => {
  const result = layout(["短い", "実績"], { maxLines: 3, maxWidth: 600 });

  expect(result).toEqual({
    fontSize: 76,
    lines: ["短い実績"],
    truncated: false,
  });
});

test("wraps longer titles in up to three lines without splitting BudouX chunks", () => {
  const segments = ["日本語の", "文節で", "自然に", "折り返す実績カード"];
  const result = layout(segments, { maxLines: 3, maxWidth: 380 });

  expect(result.lines.length).toBeLessThanOrEqual(3);
  expect(result.lines.join("")).toBe(segments.join(""));
  expect(result.fontSize).toBeOneOf(TITLE_SIZES);

  const legalBreaks = new Set<number>();
  let boundary = 0;
  for (const segment of segments) {
    boundary += Array.from(segment).length;
    legalBreaks.add(boundary);
  }
  boundary = 0;
  for (const line of result.lines.slice(0, -1)) {
    boundary += Array.from(line).length;
    expect(legalBreaks.has(boundary)).toBe(true);
  }
});

test("truncates titles that cannot fit in three lines at the minimum size", () => {
  const segments = Array.from({ length: 40 }, () => "日本");
  const result = layout(segments, { maxLines: 3, maxWidth: 160 });

  expect(result.fontSize).toBe(40);
  expect(result.lines).toHaveLength(3);
  expect(result.truncated).toBe(true);
  expect(result.lines.at(-1)).toMatch(ELLIPSIS_AT_END);
});

test("keeps Japanese opening and closing brackets off forbidden line edges", () => {
  const segments = ["変更点は「", "括弧を", "使って", "います」。"];
  const result = layout(segments, { maxLines: 3, maxWidth: 400 });

  expect(result.lines.join("")).toBe(segments.join(""));
  expect(result.lines.some((line) => CLOSING_BRACKET_AT_START.test(line))).toBe(
    false
  );
  expect(result.lines.some((line) => OPENING_BRACKET_AT_END.test(line))).toBe(
    false
  );
});

test("ellipsizes overflowing summary text within two lines", () => {
  const segments = [
    "日本語の",
    "一言を",
    "二行以内に",
    "収めるための",
    "長い説明です。",
  ];
  const result = layout(segments, {
    maxLines: 2,
    maxWidth: 180,
    sizes: [26],
  });

  expect(result.fontSize).toBe(26);
  expect(result.lines).toHaveLength(2);
  expect(result.truncated).toBe(true);
  expect(result.lines.at(-1)).toMatch(ELLIPSIS_AT_END);
});

test("shows at most three tag chips and counts hidden tags", () => {
  expect(layoutTags(["Workers", "OGP"])).toEqual(["Workers", "OGP"]);
  expect(layoutTags(["Workers", "OGP", "日本語", "フォント", "計測"])).toEqual([
    "Workers",
    "OGP",
    "+3",
  ]);
});

test("keeps short Japanese tag labels unchanged", () => {
  expect(layoutTags(["読書", "記録"])).toEqual(["読書", "記録"]);
});

test("truncates long Japanese tag labels to the character limit", () => {
  expect(layoutTags(["これは極端に長い日本語のタグ名です"])).toEqual([
    "これは極端に長い日本語…",
  ]);
});

test("truncates long English tag labels to the character limit", () => {
  expect(layoutTags(["abcdefghijklmnop"])).toEqual(["abcdefghijk…"]);
});

test("preserves supported JIS level-one kanji and replaces missing glyphs", () => {
  expect(normalizeSupportedText("設計変更を検証😀𠮷")).toBe("設計変更を検証□□");
});
