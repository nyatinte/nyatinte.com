const FENCE_START = /^ {0,3}(`{3,}|~{3,})/u;
const FENCE_END = /^ {0,3}(`+|~+)[ \t]*$/u;
const INDENTED_CODE = /^(?: {4}|\t)/u;
const LINE_ENDING = /\r?\n$/u;
const LINE_SPLIT = /(?<=\n)/u;
const SVELTE_OPEN = /^[ \t]*<(style|script)(?:\s[^>]*)?>/u;
const MARKDOWN_IMAGE =
  /!\[([^\]]*)\]\(\s*<?([^\s)>]+)>?(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/gu;
const HTML_IMAGE = /<img\b[^>]*>/giu;
const LOCAL_IMAGE = /^\.\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpe?g|webp|gif)$/u;
const SITE_CHROME =
  /^\/images\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|jpe?g|webp|gif)$/u;
const OGP_IMAGE = /^\.\/og\.(?:png|jpe?g|webp|gif)$/u;
const SVELTE_SRC = /^\{[\s\S]+\}$/u;
const NUMERIC = /^\d+$/u;

export interface ArticleImageIssue {
  message: string;
}

interface Fence {
  character: string;
  length: number;
}

function lineContent(line: string) {
  return line.replace(LINE_ENDING, "");
}

function openingFence(line: string): Fence | null {
  const marker = line.match(FENCE_START)?.[1];
  if (!marker) {
    return null;
  }
  return { character: marker[0] ?? "", length: marker.length };
}

function closesFence(line: string, fence: Fence) {
  const marker = line.match(FENCE_END)?.[1];
  return marker?.[0] === fence.character && marker.length >= fence.length;
}

function htmlAttribute(tag: string, name: string) {
  const pattern = new RegExp(
    `\\s${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|(\\{[^}]*\\})|([^\\s>]+)))?`,
    "iu",
  );
  const match = pattern.exec(tag);
  if (!match) {
    return null;
  }
  if (match[1] !== undefined) {
    return match[1];
  }
  if (match[2] !== undefined) {
    return match[2];
  }
  if (match[3] !== undefined) {
    return match[3];
  }
  if (match[4] !== undefined) {
    return match[4];
  }
  return "";
}

function markupRegions(body: string) {
  let fence: Fence | null = null;
  let inIndentedCode = false;
  let previousBlank = true;
  let svelteTag: string | null = null;
  const regions: Array<string> = [];

  for (const line of body.split(LINE_SPLIT)) {
    const content = lineContent(line);

    if (fence) {
      if (closesFence(content, fence)) {
        fence = null;
      }
      previousBlank = content.trim() === "";
      continue;
    }

    if (inIndentedCode) {
      if (content.trim() === "" || INDENTED_CODE.test(content)) {
        previousBlank = content.trim() === "";
        continue;
      }
      inIndentedCode = false;
    }

    if (svelteTag) {
      if (content.includes(`</${svelteTag}>`)) {
        svelteTag = null;
      }
      previousBlank = content.trim() === "";
      continue;
    }

    const fenceMarker = openingFence(content);
    if (fenceMarker) {
      fence = fenceMarker;
      previousBlank = false;
      continue;
    }

    if (previousBlank && INDENTED_CODE.test(content)) {
      inIndentedCode = true;
      previousBlank = false;
      continue;
    }

    const opened = content.match(SVELTE_OPEN)?.[1];
    if (opened && !content.includes(`</${opened}>`)) {
      svelteTag = opened;
      previousBlank = content.trim() === "";
      continue;
    }

    regions.push(line);
    previousBlank = content.trim() === "";
  }

  return regions.join("");
}

function markdownImageIssues(markup: string) {
  const issues: Array<ArticleImageIssue> = [];
  for (const match of markup.matchAll(MARKDOWN_IMAGE)) {
    const alt = match[1] ?? "";
    const src = match[2] ?? "";
    if (alt.trim() === "") {
      issues.push({
        message: `Markdown image needs alternative text: ${match[0]}`,
      });
    }
    if (!LOCAL_IMAGE.test(src)) {
      issues.push({
        message: `Markdown image must be a file in the article directory: ${src}`,
      });
    } else if (OGP_IMAGE.test(src)) {
      issues.push({
        message: `Article body must not reuse the OGP image: ${src}`,
      });
    }
  }
  return issues;
}

function htmlImageIssues(markup: string) {
  const issues: Array<ArticleImageIssue> = [];
  for (const match of markup.matchAll(HTML_IMAGE)) {
    const tag = match[0];
    if (htmlAttribute(tag, "alt") === null) {
      issues.push({ message: `img needs an alt attribute: ${tag}` });
    }
    const src = htmlAttribute(tag, "src");
    if (
      src === null ||
      !(LOCAL_IMAGE.test(src) || SITE_CHROME.test(src) || SVELTE_SRC.test(src))
    ) {
      issues.push({
        message: `img source must be a local article file, site chrome, or a Svelte expression: ${src ?? tag}`,
      });
    } else if (src && OGP_IMAGE.test(src)) {
      issues.push({
        message: `Article body must not reuse the OGP image: ${src}`,
      });
    }
    const width = htmlAttribute(tag, "width");
    const height = htmlAttribute(tag, "height");
    if (
      width === null ||
      height === null ||
      !(NUMERIC.test(width) && NUMERIC.test(height))
    ) {
      issues.push({ message: `img needs a numeric width and height: ${tag}` });
    }
  }
  return issues;
}

export function articleBodyImageIssues(body: string) {
  const markup = markupRegions(body);
  return [...markdownImageIssues(markup), ...htmlImageIssues(markup)];
}

export function localArticleImagePaths(body: string) {
  const markup = markupRegions(body);
  const paths: Array<string> = [];
  for (const match of markup.matchAll(MARKDOWN_IMAGE)) {
    const src = match[2] ?? "";
    if (LOCAL_IMAGE.test(src)) {
      paths.push(src);
    }
  }
  for (const match of markup.matchAll(HTML_IMAGE)) {
    const src = htmlAttribute(match[0], "src");
    if (src && LOCAL_IMAGE.test(src)) {
      paths.push(src);
    }
  }
  return paths;
}

export function assertArticleBodyImages(label: string, body: string) {
  const issues = articleBodyImageIssues(body);
  if (issues.length === 0) {
    return;
  }
  throw new Error(
    `${label}: ${issues.map((issue) => issue.message).join("; ")}`,
  );
}
