import type { SearchSegment } from "./types";

const scriptBlock = /<script\b[^>]*>[\s\S]*?<\/script>/giu;
const styleBlock = /<style\b[^>]*>[\s\S]*?<\/style>/giu;
const selfClosingComponent =
  /^[ \t]*<[A-Z][\w.]*(?:\s(?:[^>"']|"[^"]*"|'[^']*')*)?\/>[ \t]*\r?\n?/gmu;
const pairedComponent = /<([A-Z][\w.]*)\b[^>]*>[\s\S]*?<\/\1>/gu;
const image = /!\[[^\]]*\]\([^)]*\)/gu;
const link = /\[([^\]]*)\]\([^)]*\)/gu;
const inlineHtml = /<[^>]+>/gu;
const fencedCodeMarker = /^[ \t]*```[^\n]*$/gmu;
const inlineCode = /`([^`]*)`/gu;
const heading = /^[ \t]{0,3}#{1,6}[ \t]+/gmu;
const blockquote = /^[ \t]{0,3}>[ \t]?/gmu;
const unorderedList = /^[ \t]*[-*+][ \t]+/gmu;
const orderedList = /^[ \t]*\d+[.)][ \t]+/gmu;
const emphasis = /[*_~]+/gu;
const whitespace = /\s+/gu;
const querySeparator = /\s+/u;

/**
 * Reduces an article body to the prose a reader sees. Svelte-only blocks,
 * markup, links, code fences, and list/heading syntax are removed while the
 * visible text inside HTML tags is kept.
 */
export function extractPlainText(source: string) {
  return source
    .replace(scriptBlock, "")
    .replace(styleBlock, "")
    .replace(selfClosingComponent, "")
    .replace(pairedComponent, "")
    .replace(image, "")
    .replace(link, "$1")
    .replace(fencedCodeMarker, "")
    .replace(inlineCode, "$1")
    .replace(heading, "")
    .replace(blockquote, "")
    .replace(unorderedList, "")
    .replace(orderedList, "")
    .replace(inlineHtml, " ")
    .replace(emphasis, "")
    .replace(whitespace, " ")
    .trim();
}

const excerptLength = 140;
const excerptLead = 50;

function markIntervals(text: string, tokens: string[]) {
  const lower = text.toLowerCase();
  const intervals: [number, number][] = [];
  for (const token of tokens) {
    if (!token) {
      continue;
    }
    let from = 0;
    while (from < lower.length) {
      const at = lower.indexOf(token, from);
      if (at === -1) {
        break;
      }
      intervals.push([at, at + token.length]);
      from = at + token.length;
    }
  }
  intervals.sort((left, right) => left[0] - right[0]);
  const merged: [number, number][] = [];
  for (const interval of intervals) {
    const last = merged.at(-1);
    if (last && interval[0] <= last[1]) {
      last[1] = Math.max(last[1], interval[1]);
    } else {
      merged.push(interval);
    }
  }
  return merged;
}

/** Slices a ~140-character window around the first query match. */
export function excerptSegments(content: string, query: string) {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(querySeparator)
    .filter(Boolean);
  const lower = content.toLowerCase();
  let first = -1;
  for (const token of tokens) {
    const at = lower.indexOf(token);
    if (at !== -1 && (first === -1 || at < first)) {
      first = at;
    }
  }
  const start = Math.max(0, (first === -1 ? 0 : first) - excerptLead);
  const window = content.slice(start, start + excerptLength);
  const segments: SearchSegment[] = [];
  let cursor = 0;
  for (const [from, to] of markIntervals(window, tokens)) {
    if (from > cursor) {
      segments.push({ mark: false, text: window.slice(cursor, from) });
    }
    segments.push({ mark: true, text: window.slice(from, to) });
    cursor = to;
  }
  if (cursor < window.length) {
    segments.push({ mark: false, text: window.slice(cursor) });
  }
  return segments.filter((segment) => segment.text.length > 0);
}
