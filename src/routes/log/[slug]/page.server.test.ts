import { expect, test } from "vite-plus/test";
import { load } from "./+page.server";
import type { PageData } from "./$types";

function resultFor(slug: string) {
  return load({ params: { slug } } as Parameters<typeof load>[0]) as PageData;
}

test("copy markdown for cua-computer-use drops svelte blocks but keeps frontmatter, html and prose", async () => {
  const result = await resultFor("cua-computer-use");

  expect(result.copyMarkdown).not.toContain("<style");
  expect(result.copyMarkdown).not.toContain("</style>");
  expect(result.copyMarkdown.startsWith("---\n")).toBe(true);
  expect(result.copyMarkdown).toContain("title: Cua がなぜ流行っているのか？");
  expect(result.copyMarkdown).toContain('<figure class="thought before">');
  expect(result.copyMarkdown).toContain("https://x.com/trycua");
  expect(result.copyMarkdown).not.toContain("\n\n\n");
});

test("copy markdown for stay-light-in-ai-era drops every svelte block but keeps html and prose", async () => {
  const result = await resultFor("stay-light-in-ai-era");

  expect(result.copyMarkdown).not.toContain("<style");
  expect(result.copyMarkdown).not.toContain("</style>");
  expect(result.copyMarkdown).not.toContain("<script");
  expect(result.copyMarkdown).not.toContain("</script>");
  expect(result.copyMarkdown).not.toContain("<XPostCard");
  expect(result.copyMarkdown.startsWith("---\n")).toBe(true);
  expect(result.copyMarkdown).toContain('<div class="closing-message">');
  expect(result.copyMarkdown).toContain("<img");
  expect(result.copyMarkdown).toContain("<p>");
  expect(result.copyMarkdown).toContain("AI をはじめとした技術の進化が");
  expect(result.copyMarkdown).not.toContain("\n\n\n");
});

test("copy markdown for markdown-only articles keeps the source unchanged", async () => {
  const result = await resultFor("template");

  expect(result.copyMarkdown).toBe(result.article.source);
});
