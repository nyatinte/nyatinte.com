const SVELTE_BLOCK_PATTERNS = [
  /^[ \t]*<style(?:\s[^>]*)?>[\s\S]*?<\/style>[ \t]*\r?\n?/gmu,
  /^[ \t]*<script(?:\s[^>]*)?>[\s\S]*?<\/script>[ \t]*\r?\n?/gmu,
  /^[ \t]*<[A-Z][\w.]*(?:\s(?:[^>"']|"[^"]*"|'[^']*')*)?\/>[ \t]*\r?\n?/gmu,
];

const EXCESS_BLANK_LINES = /\r?\n(?:[ \t]*\r?\n){2,}/gu;
const FENCE_START = /^ {0,3}(`{3,}|~{3,})/u;
const FENCE_END = /^ {0,3}(`+|~+)[ \t]*$/u;
const INDENTED_CODE = /^(?: {4}|\t)/u;
const LINE_ENDING = /\r?\n$/u;
const LINE_SPLIT = /(?<=\n)/u;
const SVELTE_OPEN = /^[ \t]*<(style|script)(?:\s[^>]*)?>/u;

interface CodeFence {
  character: string;
  length: number;
}

interface ScanState {
  code: string;
  fence: CodeFence | null;
  inCode: boolean;
  inIndentedCode: boolean;
  previousBlank: boolean;
  segments: Segment[];
  svelteTag: string | null;
  text: string;
}

interface Segment {
  kind: "code" | "text";
  text: string;
}

function lineContent(line: string) {
  return line.replace(LINE_ENDING, "");
}

function openingFence(line: string): CodeFence | null {
  const marker = line.match(FENCE_START)?.[1];
  if (!marker) {
    return null;
  }
  return { character: marker[0] ?? "", length: marker.length };
}

function closesFence(line: string, fence: CodeFence) {
  const marker = line.match(FENCE_END)?.[1];
  return marker?.[0] === fence.character && marker.length >= fence.length;
}

function startCode(state: ScanState) {
  if (state.inCode) {
    return;
  }
  if (state.text) {
    state.segments.push({ kind: "text", text: state.text });
    state.text = "";
  }
  state.inCode = true;
}

function endCode(state: ScanState) {
  if (!state.inCode) {
    return;
  }
  if (state.code) {
    state.segments.push({ kind: "code", text: state.code });
    state.code = "";
  }
  state.inCode = false;
}

function markBlank(state: ScanState, content: string) {
  state.previousBlank = content.trim() === "";
}

function consumeFenceLine(
  state: ScanState,
  line: string,
  content: string,
  fence: CodeFence
) {
  state.code += line;
  if (closesFence(content, fence)) {
    state.fence = null;
    endCode(state);
  }
  markBlank(state, content);
}

function consumeIndentedCodeLine(
  state: ScanState,
  line: string,
  content: string
) {
  if (content.trim() === "" || INDENTED_CODE.test(content)) {
    state.code += line;
    markBlank(state, content);
    return true;
  }
  state.inIndentedCode = false;
  endCode(state);
  return false;
}

function consumeSvelteLine(
  state: ScanState,
  line: string,
  content: string,
  svelteTag: string
) {
  state.text += line;
  if (content.includes(`</${svelteTag}>`)) {
    state.svelteTag = null;
  }
  markBlank(state, content);
}

function splitCodeBlocks(markdown: string): Segment[] {
  const state: ScanState = {
    code: "",
    fence: null,
    inCode: false,
    inIndentedCode: false,
    previousBlank: true,
    segments: [],
    svelteTag: null,
    text: "",
  };

  for (const line of markdown.split(LINE_SPLIT)) {
    const content = lineContent(line);

    if (state.fence) {
      consumeFenceLine(state, line, content, state.fence);
      continue;
    }

    if (state.inIndentedCode && consumeIndentedCodeLine(state, line, content)) {
      continue;
    }

    if (state.svelteTag) {
      consumeSvelteLine(state, line, content, state.svelteTag);
      continue;
    }

    const fenceMarker = openingFence(content);
    if (fenceMarker) {
      state.fence = fenceMarker;
      startCode(state);
      state.code += line;
      state.previousBlank = false;
      continue;
    }

    if (state.previousBlank && INDENTED_CODE.test(content)) {
      state.inIndentedCode = true;
      startCode(state);
      state.code += line;
      state.previousBlank = false;
      continue;
    }

    const svelte = content.match(SVELTE_OPEN)?.[1];
    state.text += line;
    if (svelte && !content.includes(`</${svelte}>`)) {
      state.svelteTag = svelte;
    }
    markBlank(state, content);
  }

  endCode(state);
  if (state.text) {
    state.segments.push({ kind: "text", text: state.text });
  }
  return state.segments;
}

export function stripSvelteBlocks(markdown: string): string {
  let changed = false;
  const result = splitCodeBlocks(markdown)
    .map((segment) => {
      if (segment.kind === "code") {
        return segment.text;
      }
      let { text } = segment;
      for (const pattern of SVELTE_BLOCK_PATTERNS) {
        text = text.replace(pattern, "");
      }
      if (text !== segment.text) {
        changed = true;
      }
      return text.replace(EXCESS_BLANK_LINES, "\n\n");
    })
    .join("");
  if (!changed) {
    return markdown;
  }
  const normalized = result.trimEnd();
  if (!normalized) {
    return "";
  }
  return markdown.endsWith("\n") ? `${normalized}\n` : normalized;
}
