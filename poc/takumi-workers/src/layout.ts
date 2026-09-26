import fontCoverage from "./font-coverage.json";

export const TITLE_FONT_SIZES = [76, 68, 58, 48, 40] as const;
export const SUMMARY_FONT_SIZE = 26;
export const MAX_TITLE_LINES = 3;
export const MAX_SUMMARY_LINES = 2;
export const MAX_TAGS = 3;

const ELLIPSIS = "…";
const FALLBACK_GLYPH = "□";
const MAX_TAG_CHARACTERS = 12;
const OPENING_BRACKETS = new Set(
  Array.from("([{（［｛〔〈《「『【〘〖｟«“‘\"'")
);
const CLOSING_BRACKETS = new Set(
  Array.from("、。，．！？：；)]}）］｝〕〉》」』】〙〗｠»”’\"'")
);
const SUPPORTED_GLYPHS = new Set(Array.from(fontCoverage.characters));

export interface TextLayout {
  fontSize: number;
  lines: string[];
  truncated: boolean;
}

export interface TextLayoutOptions {
  fontSizes: readonly number[];
  maxLines: number;
  maxWidth: number;
  measurements: ReadonlyMap<number, ReadonlyMap<string, number>>;
}

interface Unit {
  text: string;
  width: number;
}

interface Candidate {
  lines: string[];
  score: number;
}

export function normalizeSupportedText(text: string): string {
  return Array.from(text, (character) =>
    SUPPORTED_GLYPHS.has(character) ||
    character === "\r" ||
    character === "\n" ||
    character === "\t"
      ? character
      : FALLBACK_GLYPH
  ).join("");
}

export function measurementInputs(segments: readonly string[]): string[] {
  return [
    ...new Set([
      ELLIPSIS,
      ...segments.flatMap((segment) => [segment, ...Array.from(segment)]),
    ]),
  ];
}

export function layoutText(
  segments: readonly string[],
  { fontSizes, maxLines, maxWidth, measurements }: TextLayoutOptions
): TextLayout {
  const parts = segments.filter(Boolean);
  if (parts.length === 0) {
    return { fontSize: fontSizes[0] ?? 0, lines: [], truncated: false };
  }

  for (const fontSize of fontSizes) {
    const units = makeUnits(
      parts,
      fontSize,
      maxWidth,
      measurements,
      fontSize === fontSizes.at(-1)
    );
    const candidate = bestPartition(units, maxWidth, maxLines);
    if (candidate) {
      return { fontSize, lines: candidate.lines, truncated: false };
    }
  }

  const fontSize = fontSizes.at(-1) ?? 0;
  const units = makeUnits(parts, fontSize, maxWidth, measurements, true);
  const ellipsis = {
    text: ELLIPSIS,
    width: getWidth(measurements, fontSize, ELLIPSIS),
  };
  return {
    fontSize,
    lines: ellipsize(units, ellipsis, maxWidth, maxLines),
    truncated: true,
  };
}

export function layoutTags(
  tags: readonly string[],
  maxTags = MAX_TAGS
): string[] {
  const visibleTags =
    tags.length <= maxTags
      ? [...tags]
      : [...tags.slice(0, maxTags - 1), `+${tags.length - maxTags + 1}`];

  return visibleTags.map((tag) => {
    const characters = Array.from(tag);
    return characters.length <= MAX_TAG_CHARACTERS
      ? tag
      : `${characters.slice(0, MAX_TAG_CHARACTERS - 1).join("")}${ELLIPSIS}`;
  });
}

function makeUnits(
  segments: readonly string[],
  fontSize: number,
  maxWidth: number,
  measurements: TextLayoutOptions["measurements"],
  allowBreakingLongSegments: boolean
): Unit[] {
  const units = segments.flatMap((text) => {
    const width = getWidth(measurements, fontSize, text);
    if (width <= maxWidth || !allowBreakingLongSegments) {
      return [{ text, width }];
    }
    return Array.from(text, (character) => ({
      text: character,
      width: getWidth(measurements, fontSize, character),
    }));
  });
  return mergeKinsoku(units);
}

function mergeKinsoku(units: readonly Unit[]): Unit[] {
  const result: Unit[] = [];
  for (const unit of units) {
    const previous = result.at(-1);
    const [first] = unit.text;
    const last = previous && Array.from(previous.text).at(-1);
    if (
      previous &&
      (OPENING_BRACKETS.has(last ?? "") || CLOSING_BRACKETS.has(first ?? ""))
    ) {
      previous.text += unit.text;
      previous.width += unit.width;
    } else {
      result.push({ ...unit });
    }
  }
  return result;
}

function ellipsize(
  units: readonly Unit[],
  ellipsis: Unit,
  maxWidth: number,
  maxLines: number
): string[] {
  const lines: Unit[][] = [];
  for (const unit of units) {
    const current = lines.at(-1);
    const currentWidth =
      current?.reduce((sum, item) => sum + item.width, 0) ?? 0;
    if (unit.width > maxWidth) {
      break;
    }
    if (current && currentWidth + unit.width <= maxWidth) {
      current.push(unit);
    } else if (lines.length < maxLines) {
      lines.push([unit]);
    } else {
      break;
    }
  }

  if (lines.length === 0) {
    lines.push([]);
  }
  const lastIndex = lines.length - 1;
  let lastLine = lines.at(-1) ?? [];
  let finalLine = mergeKinsoku([...lastLine, ellipsis]);
  const width = (line: readonly Unit[]) =>
    line.reduce((sum, unit) => sum + unit.width, 0);

  while (lastLine.length > 0 && width(finalLine) > maxWidth) {
    lastLine = lastLine.slice(0, -1);
    lines[lastIndex] = lastLine;
    finalLine = mergeKinsoku([...lastLine, ellipsis]);
  }

  lines[lastIndex] = finalLine;
  return lines.map((line) => line.map(({ text }) => text).join(""));
}

function bestPartition(
  units: readonly Unit[],
  maxWidth: number,
  maxLines: number
): Candidate | undefined {
  const count = units.length;
  if (count === 0) {
    return { lines: [], score: 0 };
  }

  const prefixWidths = [0];
  let prefixWidth = 0;
  for (const unit of units) {
    prefixWidth += unit.width;
    prefixWidths.push(prefixWidth);
  }

  const states: (Candidate | undefined)[][] = Array.from(
    { length: maxLines + 1 },
    () => new Array(count + 1).fill(undefined)
  );
  states[0][0] = { lines: [], score: 0 };

  for (let lineCount = 1; lineCount <= maxLines; lineCount += 1) {
    for (let end = lineCount; end <= count; end += 1) {
      states[lineCount][end] = bestPartitionEndingAt(
        units,
        prefixWidths,
        states,
        lineCount,
        end,
        maxWidth
      );
    }
  }

  return states
    .slice(1)
    .map((lineStates) => lineStates[count])
    .filter((candidate): candidate is Candidate => candidate !== undefined)
    .sort((left, right) => left.score - right.score)[0];
}

function bestPartitionEndingAt(
  units: readonly Unit[],
  prefixWidths: readonly number[],
  states: (Candidate | undefined)[][],
  lineCount: number,
  end: number,
  maxWidth: number
): Candidate | undefined {
  let best: Candidate | undefined;
  for (let start = lineCount - 1; start < end; start += 1) {
    const previous = states[lineCount - 1][start];
    if (!previous) {
      continue;
    }
    const width = prefixWidths[end] - prefixWidths[start];
    if (width > maxWidth) {
      continue;
    }
    const candidate: Candidate = {
      lines: [
        ...previous.lines,
        units
          .slice(start, end)
          .map(({ text }) => text)
          .join(""),
      ],
      score: previous.score + (maxWidth - width) ** 2,
    };
    if (!best || candidate.score < best.score) {
      best = candidate;
    }
  }
  return best;
}

function getWidth(
  measurements: TextLayoutOptions["measurements"],
  fontSize: number,
  text: string
): number {
  const width = measurements.get(fontSize)?.get(text);
  if (width === undefined) {
    throw new Error(
      `Missing Takumi measurement for ${JSON.stringify(text)} at ${fontSize}px`
    );
  }
  return width;
}
