import { createTwoFilesPatch } from "diff";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { splitFrontmatter } from "./frontmatter";

interface SourcePosition {
  end?: { offset?: number };
  start?: { offset?: number };
}

interface MarkdownNode {
  children?: Array<MarkdownNode>;
  position?: SourcePosition;
  type: string;
  value?: string;
}

interface RootNode extends MarkdownNode {
  children: Array<MarkdownNode>;
  type: "root";
}

export interface ArticleBlock {
  editable: boolean;
  end: number;
  start: number;
  text: string;
}

export interface ArticlePatchInput {
  after: string;
  before: string;
  extension: "md" | "svx";
  pr?: string;
  sha?: string;
  slug: string;
}

const EDITABLE_TYPES = new Set(["blockquote", "heading", "list", "paragraph"]);

const PATCH_PREAMBLE = /^=+\n/u;

function onlyImages(node: MarkdownNode): boolean {
  const children = node.children ?? [];
  if (children.length === 0) {
    return false;
  }
  return children.every((child) => {
    if (child.type === "image") {
      return true;
    }
    if (child.type === "text") {
      return (child.value ?? "").trim() === "";
    }
    if (child.type === "link") {
      return onlyImages(child);
    }
    return false;
  });
}

function editable(node: MarkdownNode) {
  if (!EDITABLE_TYPES.has(node.type)) {
    return false;
  }
  return node.type !== "paragraph" || !onlyImages(node);
}

function parseBody(body: string) {
  return unified()
    .use(remarkParse)
    .use(remarkDirective)
    .parse(body) as RootNode;
}

export function normalizeSource(source: string) {
  return source.replaceAll("\r\n", "\n");
}

export function extractBlocks(rawSource: string): Array<ArticleBlock> {
  const source = normalizeSource(rawSource);
  const split = splitFrontmatter(source);
  if (!split) {
    return [];
  }
  const bodyStart = source.length - split.body.length;
  const tree = parseBody(split.body);
  const blocks: Array<ArticleBlock> = [];
  for (const node of tree.children) {
    const start = node.position?.start?.offset;
    const end = node.position?.end?.offset;
    if (start === undefined || end === undefined) {
      continue;
    }
    const absoluteStart = bodyStart + start;
    const absoluteEnd = bodyStart + end;
    blocks.push({
      editable: editable(node),
      end: absoluteEnd,
      start: absoluteStart,
      text: source.slice(absoluteStart, absoluteEnd),
    });
  }
  return blocks;
}

export function applyEdits(rawSource: string, edits: Map<number, string>) {
  const source = normalizeSource(rawSource);
  const blocks = extractBlocks(source);
  const replacements: Array<{ end: number; start: number; text: string }> = [];
  for (const [index, text] of edits) {
    const block = blocks[index];
    if (!block?.editable) {
      continue;
    }
    replacements.push({ end: block.end, start: block.start, text });
  }
  replacements.sort((left, right) => right.start - left.start);
  let result = source;
  for (const replacement of replacements) {
    result = `${result.slice(0, replacement.start)}${replacement.text}${result.slice(replacement.end)}`;
  }
  return result;
}

export function createArticlePatch({
  after,
  before,
  extension,
  pr,
  sha,
  slug,
}: ArticlePatchInput) {
  if (before === after) {
    return null;
  }
  const path = `src/content/log/${slug}/index.${extension}`;
  const diff = createTwoFilesPatch(
    `a/${path}`,
    `b/${path}`,
    before,
    after,
  ).replace(PATCH_PREAMBLE, "");
  const header: Array<string> = [];
  if (pr) {
    header.push(`PR #${pr}`);
  }
  if (sha) {
    header.push(`@ ${sha.slice(0, 7)}`);
  }
  return `${header.length > 0 ? `# ${header.join(" ")}\n` : ""}${diff}`;
}
