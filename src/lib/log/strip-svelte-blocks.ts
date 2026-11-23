const SVELTE_BLOCK_PATTERNS = [
  /^[ \t]*<style(?:\s[^>]*)?>[\s\S]*?<\/style>[ \t]*\r?\n?/gmu,
  /^[ \t]*<script(?:\s[^>]*)?>[\s\S]*?<\/script>[ \t]*\r?\n?/gmu,
  /^[ \t]*<[A-Z][\w.]*(?:\s(?:[^>"']|"[^"]*"|'[^']*')*)?\/>[ \t]*\r?\n?/gmu,
];

const EXCESS_BLANK_LINES = /\r?\n(?:[ \t]*\r?\n){2,}/gu;

export function stripSvelteBlocks(markdown: string): string {
  let result = markdown;
  for (const pattern of SVELTE_BLOCK_PATTERNS) {
    result = result.replace(pattern, "");
  }
  if (result === markdown) {
    return markdown;
  }
  const normalized = result.replace(EXCESS_BLANK_LINES, "\n\n").trimEnd();
  if (!normalized) {
    return "";
  }
  return markdown.endsWith("\n") ? `${normalized}\n` : normalized;
}
