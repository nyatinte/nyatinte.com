import { expect, test, vi } from "vite-plus/test";
import { load } from "./+page.server";
import type { PageData } from "./$types";

const codeBlockArticle = vi.hoisted(() => {
  const body = [
    "コードブロックの例です。",
    "",
    "```html",
    "<style>",
    "  .inside-code { color: red; }",
    "</style>",
    "```",
    "",
    "インデントしたコードブロックの例です。",
    "",
    "    <style>",
    "      .inside-indented-code { color: green; }",
    "    </style>",
    "",
    "コードブロックの外の style は消えます。",
    "",
    "<style>",
    "  .outside-code { color: blue; }",
    "</style>",
  ].join("\n");
  return {
    body,
    date: "2026-01-01",
    description: "コードブロック内の style を保持する。",
    slug: "code-block-style",
    source: `---\ntitle: コードブロック内の style\ndescription: コードブロック内の style を保持する。\ndate: 2026-01-01\n---\n\n${body}`,
    title: "コードブロック内の style",
  };
});

vi.mock("../../../lib/log/articles", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../lib/log/articles")>();
  return {
    ...actual,
    getArticle: (slug: string) =>
      slug === codeBlockArticle.slug
        ? codeBlockArticle
        : actual.getArticle(slug),
  };
});

function resultFor(slug: string) {
  return load({ params: { slug } } as Parameters<typeof load>[0]) as PageData;
}

test("copy markdown for cua-computer-use drops svelte blocks but keeps frontmatter, html and prose", async () => {
  const result = resultFor("cua-computer-use");

  expect(result.copyMarkdown).not.toContain("<style");
  expect(result.copyMarkdown).not.toContain("</style>");
  expect(result.copyMarkdown.startsWith("---\n")).toBe(true);
  expect(result.copyMarkdown).toContain("title: Cua がなぜ流行っているのか？");
  expect(result.copyMarkdown).toContain(
    ':::figure{eyebrow=BEFORE title="デスクトップ操作の側面しか見えてなかった Cua" note="Codex Computer Use でよくないか？"}',
  );
  expect(result.copyMarkdown).toContain("https://x.com/trycua");
  expect(result.copyMarkdown).toContain(":::flow");
  expect(result.copyMarkdown).toContain('<div class="before-scene"');
  expect(result.copyMarkdown).not.toContain("<ArticleFigure");

  expect(result.copyMarkdown).not.toContain("\n\n\n");
});

test("copy markdown for stay-light-in-ai-era drops every svelte block but keeps html and prose", async () => {
  const result = resultFor("stay-light-in-ai-era");

  expect(result.copyMarkdown).not.toContain("<style");
  expect(result.copyMarkdown).not.toContain("</style>");
  expect(result.copyMarkdown).not.toContain("<script");
  expect(result.copyMarkdown).not.toContain("</script>");
  expect(result.copyMarkdown).not.toContain("<XPostCard");
  expect(result.copyMarkdown.startsWith("---\n")).toBe(true);
  expect(result.copyMarkdown).toContain(":::x-post");
  expect(result.copyMarkdown).toContain("Claude Code に Code Mode 来たんだ");
  expect(result.copyMarkdown).toContain(":::closing");
  expect(result.copyMarkdown).toContain("飛びつきます");
  expect(result.copyMarkdown).not.toContain('<div class="closing-message">');
  expect(result.copyMarkdown).toContain("AI をはじめとした技術の進化が");
  expect(result.copyMarkdown).not.toContain("\n\n\n");
});

test("copy markdown for markdown-only articles keeps the source unchanged", async () => {
  const result = resultFor("template");

  expect(result.copyMarkdown).toBe(result.article.source);
});

test("copy markdown keeps style inside markdown code blocks and drops top-level style", async () => {
  const result = resultFor("code-block-style");

  expect(result.copyMarkdown).toContain(
    "<style>\n  .inside-code { color: red; }\n</style>",
  );
  expect(result.copyMarkdown).toContain(
    "    <style>\n      .inside-indented-code { color: green; }\n    </style>",
  );
  expect(result.copyMarkdown).not.toContain(".outside-code");
});
