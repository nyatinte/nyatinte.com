import { dirname, relative, sep } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDirective from "remark-directive";

const LOCAL_IMAGE = /^\.\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpe?g|webp|gif)$/u;
const DIRECTIVE_OPEN =
  /^[ \t]*:{3,}[A-Za-z][\w-]*(?:\[.*\])?(?:\{[\s\S]*\})?[ \t]*$/u;
const DIRECTIVE_CLOSE = /^[ \t]*:{3,}[ \t]*$/u;
const FENCE_START = /^ {0,3}(`{3,}|~{3,})/u;
const FENCE_END = /^ {0,3}(`+|~+)[ \t]*$/u;
const INDENTED_CODE = /^(?: {4}|\t)/u;
const LINE_ENDING = /\r?\n$/u;
const LINE_SPLIT = /(?<=\n)/u;
const LIST_MARKER = /^[ \t]*(?:[-+*]|\d+[.)])[ \t]+/u;
const ATTRIBUTE_VALUE = /(?:"([^"]*)"|'([^']*)'|=\s*([^\s}"']+))/gu;
const MODULE_SCRIPT = /\b(?:module|context\s*=\s*["']module["'])/u;

interface SourcePosition {
  end?: { offset?: number };
  start?: { offset?: number };
}

interface DirectiveAttributes {
  [name: string]: string | null | undefined;
}

interface NodeBase {
  children?: Array<NodeBase>;
  position?: SourcePosition;
  type: string;
}

interface RootNode extends NodeBase {
  type: "root";
}

interface ListItemNode extends NodeBase {
  type: "listItem";
}

interface ListNode extends NodeBase {
  children?: Array<ListItemNode>;
  type: "list";
}

interface DirectiveNode extends NodeBase {
  attributes?: DirectiveAttributes | null;
  name: string;
  type: "containerDirective" | "leafDirective" | "textDirective";
}

function toPosixPath(path: string) {
  return path.split(sep).join("/");
}

function componentImportPath(filename: string, fromLib: string) {
  const from = filename ? dirname(filename) : "src/content/log/article";
  const path = toPosixPath(relative(from, `src/lib/${fromLib}`));
  if (path.startsWith(".")) {
    return path;
  }
  return `./${path}`;
}

export const ARTICLE_DIRECTIVES = {
  closing: {
    component: "ArticleClosing",
    fromLib: "components/article-closing.svelte",
    imageProps: ["image"],
    props: ["image"],
    required: [],
  },
  figure: {
    component: "ArticleFigure",
    fromLib: "components/article-figure.svelte",
    imageProps: [],
    props: ["eyebrow", "title", "note"],
    required: ["title"],
  },
  flow: {
    component: "ArticleFlow",
    fromLib: "components/article-flow.svelte",
    imageProps: [],
    props: [],
    required: [],
  },
  "x-post": {
    component: "XPostCard",
    fromLib: "components/x-post-card.svelte",
    imageProps: [],
    props: ["href"],
    required: ["href"],
  },
} as const;

export type ArticleDirectiveName = keyof typeof ARTICLE_DIRECTIVES;

interface ImageImport {
  id: string;
  path: string;
}

interface TransformContext {
  body: string;
  filename: string;
  images: Map<string, ImageImport>;
  used: Set<ArticleDirectiveName>;
}

interface SourceRange {
  end: number;
  start: number;
}

function isArticleDirectiveName(name: string): name is ArticleDirectiveName {
  return Object.hasOwn(ARTICLE_DIRECTIVES, name);
}

function isContainerDirective(node: { type: string }): node is DirectiveNode {
  return node.type === "containerDirective";
}

function isDirectiveType(type: string) {
  return (
    type === "containerDirective" ||
    type === "leafDirective" ||
    type === "textDirective"
  );
}

function fileLabel(filename: string) {
  return filename || "markdown";
}

function fail(filename: string, message: string): never {
  throw new Error(`${fileLabel(filename)}: ${message}`);
}

function propName(key: string) {
  return key.replaceAll(/-([a-z])/gu, (_match, letter: string) =>
    letter.toUpperCase(),
  );
}

function nodeRange(
  node: {
    position?: { end?: { offset?: number }; start?: { offset?: number } };
  },
  filename: string,
): SourceRange {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;
  if (start === undefined || end === undefined) {
    fail(filename, "directive is missing source position");
  }
  return { end, start };
}

function closingLineStart(
  body: string,
  start: number,
  end: number,
  name: string,
  filename: string,
) {
  let search = end;
  while (search > start) {
    const newline = body.lastIndexOf("\n", search - 1);
    const lineStart = newline < start ? start : newline + 1;
    const line = body.slice(lineStart, search).replace(LINE_ENDING, "");
    if (DIRECTIVE_CLOSE.test(line)) {
      return lineStart;
    }
    if (line.trim() !== "") {
      break;
    }
    search = lineStart > start ? Math.max(start, newline) : start;
  }
  fail(filename, `:::${name} is missing a closing fence`);
}

function insideRange(
  node: DirectiveNode,
  body: string,
  filename: string,
): SourceRange {
  const { end, start } = nodeRange(node, filename);
  const openEnd = body.indexOf("\n", start);
  if (openEnd === -1 || openEnd >= end) {
    fail(filename, `:::${node.name} is missing a closing fence`);
  }
  const closeStart = closingLineStart(body, start, end, node.name, filename);
  if (closeStart <= openEnd) {
    return { end: openEnd + 1, start: openEnd + 1 };
  }
  return { end: closeStart, start: openEnd + 1 };
}

function splitFrontmatter(source: string) {
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) {
    return { body: normalized, prefix: "" };
  }
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) {
    return { body: normalized, prefix: "" };
  }
  const after = end + 4;
  const prefix = normalized.startsWith("\n", after)
    ? normalized.slice(0, after + 1)
    : `${normalized.slice(0, after)}\n`;
  const body = normalized.startsWith("\n", after)
    ? normalized.slice(after + 1)
    : normalized.slice(after);
  return { body, prefix };
}

function attributes(node: DirectiveNode) {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(node.attributes ?? {})) {
    if (value === null || value === undefined) {
      continue;
    }
    result.set(propName(key), String(value));
  }
  return result;
}

function unexpectedAttribute(
  name: ArticleDirectiveName,
  key: string,
  filename: string,
) {
  fail(filename, `:::${name} has an unknown attribute: ${key}`);
}

function missingAttribute(
  name: ArticleDirectiveName,
  key: string,
  filename: string,
) {
  fail(filename, `:::${name} is missing ${key}`);
}

function imageImport(path: string, context: TransformContext) {
  const existing = context.images.get(path);
  if (existing) {
    return existing.id;
  }
  const image: ImageImport = {
    id: `__directive_img_${context.images.size}`,
    path,
  };
  context.images.set(path, image);
  return image.id;
}

function svelteAttribute(
  key: string,
  value: string,
  context: TransformContext,
  imageProps: ReadonlyArray<string>,
) {
  if (imageProps.includes(key) && LOCAL_IMAGE.test(value)) {
    return `${key}={${imageImport(value, context)}}`;
  }
  return `${key}={${JSON.stringify(value)}}`;
}

function openingTag(
  name: ArticleDirectiveName,
  node: DirectiveNode,
  context: TransformContext,
) {
  const definition = ARTICLE_DIRECTIVES[name];
  const values = attributes(node);
  for (const key of values.keys()) {
    if (!(definition.props as ReadonlyArray<string>).includes(key)) {
      unexpectedAttribute(name, key, context.filename);
    }
  }
  for (const key of definition.required) {
    if (!values.get(key)) {
      missingAttribute(name, key, context.filename);
    }
  }
  const parts: Array<string> = [definition.component];
  for (const key of definition.props) {
    const value = values.get(key);
    if (value === undefined) {
      continue;
    }
    parts.push(svelteAttribute(key, value, context, definition.imageProps));
  }
  return `<${parts.join(" ")}>`;
}

function directDirectives(node: { children?: Array<{ type: string }> }) {
  return (node.children ?? []).filter((child) => isContainerDirective(child));
}

function applyReplacements(
  source: string,
  replacements: Array<{ end: number; start: number; text: string }>,
) {
  let result = source;
  const ordered = [...replacements].sort(
    (left, right) => right.start - left.start,
  );
  for (const item of ordered) {
    result = `${result.slice(0, item.start)}${item.text}${result.slice(item.end)}`;
  }
  return result;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function flowPart(value: string) {
  return escapeHtml(value.trim()).replaceAll(/&lt;br\s*\/?&gt;/giu, "<br />");
}

function listItemSource(item: ListItemNode, body: string, filename: string) {
  const range = nodeRange(item, filename);
  const raw = body.slice(range.start, range.end).replace(LINE_ENDING, "");
  return raw.replace(LIST_MARKER, "").trimEnd();
}

function flowItems(node: DirectiveNode, body: string, filename: string) {
  const list = (node.children ?? []).find(
    (child): child is ListNode => child.type === "list",
  );
  const items = list?.children ?? [];
  if (items.length === 0) {
    fail(filename, ":::flow needs a list of steps");
  }
  return items.map((item) => {
    const source = listItemSource(item, body, filename);
    const separator = source.indexOf("|");
    if (separator === -1) {
      fail(filename, ":::flow steps must be written as `label | value`");
    }
    return {
      label: flowPart(source.slice(0, separator)),
      value: flowPart(source.slice(separator + 1)),
    };
  });
}

function renderFlow(node: DirectiveNode, context: TransformContext) {
  const items = flowItems(node, context.body, context.filename);
  const center = items.length % 2 === 1 ? Math.floor(items.length / 2) : -1;
  const parts: Array<string> = [];
  items.forEach((item, index) => {
    if (index > 0) {
      parts.push('<span class="flow-arrow" aria-hidden="true">→</span>');
    }
    const className = index === center ? ' class="flow-center"' : "";
    parts.push(
      `<div${className}><small>${item.label}</small><strong>${item.value}</strong></div>`,
    );
  });
  return `${openingTag("flow", node, context)}\n${parts.join("\n")}\n</${ARTICLE_DIRECTIVES.flow.component}>`;
}

function renderInside(node: DirectiveNode, context: TransformContext) {
  const range = insideRange(node, context.body, context.filename);
  const inner = context.body.slice(range.start, range.end);
  const replacements = directDirectives(node).map((child) => {
    const childRange = nodeRange(child, context.filename);
    return {
      end: childRange.end - range.start,
      start: childRange.start - range.start,
      text: renderDirective(child, context),
    };
  });
  return applyReplacements(inner, replacements);
}

function renderDirective(
  node: DirectiveNode,
  context: TransformContext,
): string {
  if (!isArticleDirectiveName(node.name)) {
    fail(context.filename, `unknown directive :::${node.name}`);
  }
  context.used.add(node.name);
  if (node.name === "flow") {
    return renderFlow(node, context);
  }
  const definition = ARTICLE_DIRECTIVES[node.name];
  const inside = renderInside(node, context);
  return `${openingTag(node.name, node, context)}\n${inside}</${definition.component}>`;
}

function walkNodes(node: NodeBase, visitNode: (node: NodeBase) => void) {
  visitNode(node);
  for (const child of node.children ?? []) {
    walkNodes(child, visitNode);
  }
}

function assertKnownDirectives(tree: RootNode, filename: string) {
  walkNodes(tree, (node) => {
    if (
      !isDirectiveType(node.type) ||
      !("name" in node) ||
      typeof node.name !== "string"
    ) {
      return;
    }
    if (!isArticleDirectiveName(node.name)) {
      fail(filename, `unknown directive :::${node.name}`);
    }
    if (!isContainerDirective(node)) {
      fail(filename, `:::${node.name} must be a container block`);
    }
  });
}

function parseBody(body: string) {
  return unified()
    .use(remarkParse)
    .use(remarkDirective)
    .parse(body) as RootNode;
}

function importLines(context: TransformContext) {
  const lines: Array<string> = [];
  const names = [...context.used].sort();
  for (const name of names) {
    const definition = ARTICLE_DIRECTIVES[name];
    lines.push(
      `import ${definition.component} from "${componentImportPath(context.filename, definition.fromLib)}";`,
    );
  }
  const images = [...context.images.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  for (const image of images) {
    lines.push(`import ${image.id} from "${image.path}";`);
  }
  return lines;
}

function injectImports(prefix: string, body: string, lines: Array<string>) {
  if (lines.length === 0) {
    return `${prefix}${body}`;
  }
  const added = `${lines.map((line) => `  ${line}`).join("\n")}\n`;
  const opening = body.match(/^[ \t]*<script([^>]*)>\r?\n/u);
  if (opening && !MODULE_SCRIPT.test(opening[1] ?? "")) {
    const index = opening[0].length;
    return `${prefix}${body.slice(0, index)}${added}${body.slice(index)}`;
  }
  return `${prefix}<script>\n${added}</script>\n\n${body}`;
}

export function transformArticleDirectives(source: string, filename = "") {
  const { body, prefix } = splitFrontmatter(source);
  const tree = parseBody(body);
  assertKnownDirectives(tree, filename);
  const context: TransformContext = {
    body,
    filename,
    images: new Map(),
    used: new Set(),
  };
  const topLevel = (tree.children ?? []).filter((node) =>
    isContainerDirective(node),
  );
  if (topLevel.length === 0) {
    return source;
  }
  const nextBody = applyReplacements(
    body,
    topLevel.map((node) => {
      const range = nodeRange(node, filename);
      return {
        end: range.end,
        start: range.start,
        text: renderDirective(node, context),
      };
    }),
  );
  return injectImports(prefix, nextBody, importLines(context));
}

function lineContent(line: string) {
  return line.replace(LINE_ENDING, "");
}

function openingFence(line: string) {
  const marker = line.match(FENCE_START)?.[1];
  if (!marker) {
    return null;
  }
  return { character: marker[0] ?? "", length: marker.length };
}

function closesFence(
  line: string,
  fence: { character: string; length: number },
) {
  const marker = line.match(FENCE_END)?.[1];
  return marker?.[0] === fence.character && marker.length >= fence.length;
}

function attributeValues(line: string) {
  const values: Array<string> = [];
  for (const match of line.matchAll(ATTRIBUTE_VALUE)) {
    const value = match[1] ?? match[2] ?? match[3] ?? "";
    if (value) {
      values.push(value);
    }
  }
  return values.join(" ");
}

export function stripDirectiveMarkers(source: string) {
  let fence: { character: string; length: number } | null = null;
  let inIndentedCode = false;
  let previousBlank = true;
  const lines: Array<string> = [];
  for (const line of source.split(LINE_SPLIT)) {
    const content = lineContent(line);
    if (fence) {
      lines.push(line);
      if (closesFence(content, fence)) {
        fence = null;
      }
      previousBlank = content.trim() === "";
      continue;
    }
    if (inIndentedCode) {
      if (content.trim() === "" || INDENTED_CODE.test(content)) {
        lines.push(line);
        previousBlank = content.trim() === "";
        continue;
      }
      inIndentedCode = false;
    }
    const fenceMarker = openingFence(content);
    if (fenceMarker) {
      fence = fenceMarker;
      lines.push(line);
      previousBlank = false;
      continue;
    }
    if (previousBlank && INDENTED_CODE.test(content)) {
      inIndentedCode = true;
      lines.push(line);
      previousBlank = false;
      continue;
    }
    if (DIRECTIVE_CLOSE.test(content)) {
      previousBlank = true;
      continue;
    }
    if (DIRECTIVE_OPEN.test(content)) {
      const values = attributeValues(content);
      if (values) {
        lines.push(`${values}\n`);
      }
      previousBlank = true;
      continue;
    }
    lines.push(line);
    previousBlank = content.trim() === "";
  }
  return lines.join("");
}
