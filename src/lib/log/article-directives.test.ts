import { expect, test } from "vite-plus/test";
import { mdsvex } from "mdsvex";
import {
  stripDirectiveMarkers,
  transformArticleDirectives,
} from "./article-directives";
import { stripSvelteBlocks } from "./strip-svelte-blocks";
import { extractPlainText } from "../search/zb-extract";

const article = `---
title: 例
description: 説明
date: 2026-11-24
---

導入の文。

:::figure{eyebrow=BEFORE title="図のタイトル" note="注釈です"}
<div class="scene">中身</div>
:::

結び。
`;

test("transformArticleDirectives leaves files without directives unchanged", () => {
  const source = "---\ntitle: 例\n---\n\n本文だけ。\n";
  expect(
    transformArticleDirectives(source, "src/content/log/example/index.md"),
  ).toBe(source);
});

test("transformArticleDirectives converts figure to a Svelte component and injects the import", () => {
  const result = transformArticleDirectives(
    article,
    "src/content/log/example/index.md",
  );
  expect(result).toContain(
    'import ArticleFigure from "../../../lib/components/article-figure.svelte";',
  );
  expect(result).toContain(
    '<ArticleFigure eyebrow={"BEFORE"} title={"図のタイトル"} note={"注釈です"}>',
  );
  expect(result).toContain('<div class="scene">中身</div>');
  expect(result).toContain("</ArticleFigure>");
  expect(result).not.toContain(":::figure");
  expect(result.startsWith("---\ntitle: 例\n")).toBe(true);
});

test("transformArticleDirectives converts flow lists and nested figure children", () => {
  const source = `:::figure{title="流れ"}
:::flow
- 左 | 手元の PC<br />またはクラウド VM
- 中央 | Cua Spaces
- 右 | 自分・エージェント
:::
:::
`;
  const result = transformArticleDirectives(
    source,
    "src/content/log/example/index.svx",
  );
  expect(result).toContain("import ArticleFigure from");
  expect(result).toContain("import ArticleFlow from");
  expect(result).toContain('<ArticleFigure title={"流れ"}>');
  expect(result).toContain("<ArticleFlow>");
  expect(result).toContain('class="flow-center"');
  expect(result).toContain("<small>中央</small><strong>Cua Spaces</strong>");
  expect(result).toContain("手元の PC<br />またはクラウド VM");
  expect(result).toContain("flow-arrow");
  expect(result).toContain("</ArticleFlow>");
  expect(result).toContain("</ArticleFigure>");
});

test("transformArticleDirectives turns local x-post images into imports", () => {
  const source = `:::x-post{href="https://x.com/nyatinte/status/1" author=nyatinte handle=nyatinte date="2026年11月14日" avatar=./nyatinte-avatar.jpg image=./code-mode-post.png imageAlt="比較図"}
ポストの本文
:::
`;
  const result = transformArticleDirectives(
    source,
    "src/content/log/example/index.svx",
  );
  expect(result).toContain(
    'import XPostCard from "../../../lib/components/x-post-card.svelte";',
  );
  expect(result).toContain(
    'import __directive_img_0 from "./nyatinte-avatar.jpg";',
  );
  expect(result).toContain(
    'import __directive_img_1 from "./code-mode-post.png";',
  );
  expect(result).toContain("avatar={__directive_img_0}");
  expect(result).toContain("image={__directive_img_1}");
  expect(result).toContain('imageAlt={"比較図"}');
  expect(result).toContain("ポストの本文");
  expect(result).not.toContain(":::x-post");
});

test("transformArticleDirectives merges imports into an existing script", () => {
  const source = `<script>
  const ready = true;
</script>

:::closing
飛びつきます
:::
`;
  const result = transformArticleDirectives(
    source,
    "src/content/log/example/index.svx",
  );
  expect(result).toMatch(
    /<script>\n {2}import ArticleClosing from "..\/..\/..\/lib\/components\/article-closing\.svelte";\n {2}const ready = true;\n<\/script>/u,
  );
  expect(result).toContain("<ArticleClosing>");
  expect(result).toContain("飛びつきます");
});

test("transformArticleDirectives throws on an unknown directive name", () => {
  expect(() =>
    transformArticleDirectives(
      ":::unknown\n中身\n:::\n",
      "src/content/log/x/index.md",
    ),
  ).toThrow("src/content/log/x/index.md: unknown directive :::unknown");
});

test("transformArticleDirectives throws on a leaf directive", () => {
  expect(() =>
    transformArticleDirectives("::figure{title=図}\n", "post.md"),
  ).toThrow("post.md: :::figure must be a container block");
});

test("transformArticleDirectives throws when a required figure title is missing", () => {
  expect(() =>
    transformArticleDirectives(":::figure\n中身\n:::\n", "post.md"),
  ).toThrow("post.md: :::figure is missing title");
});

test("transformArticleDirectives leaves a fenced ::: alone and does not inject imports", () => {
  const source = "例です。\n\n```md\n:::figure{title=図}\n中身\n:::\n```\n";
  expect(transformArticleDirectives(source, "post.md")).toBe(source);
});

test("mdsvex compiles a transformed figure into the Svelte component tag", async () => {
  const transformed = transformArticleDirectives(article, "example.svx");
  const compiled = await mdsvex({
    highlight: false,
    smartypants: false,
  }).markup({
    content: transformed,
    filename: "example.svx",
  });
  expect(compiled?.code).toContain("<ArticleFigure");
  expect(compiled?.code).toContain("</ArticleFigure>");
  expect(compiled?.code).toContain("図のタイトル");
  expect(compiled?.code).toContain('class="scene"');
});

test("stripSvelteBlocks keeps directive source and still drops style", () => {
  const source = `${article}\n<style>\n  .scene { color: red; }\n</style>\n`;
  const result = stripSvelteBlocks(source);
  expect(result).toContain(
    ':::figure{eyebrow=BEFORE title="図のタイトル" note="注釈です"}',
  );
  expect(result).toContain('<div class="scene">中身</div>');
  expect(result).toContain(":::");
  expect(result).not.toContain("<style");
  expect(result).toContain("導入の文。");
});

test("stripDirectiveMarkers drops fence lines but keeps body text and visible attributes", () => {
  const result = stripDirectiveMarkers(article);
  expect(result).not.toContain(":::figure");
  expect(result).not.toMatch(/^:::$/mu);
  expect(result).toContain("BEFORE");
  expect(result).toContain("図のタイトル");
  expect(result).toContain("注釈です");
  expect(result).toContain('<div class="scene">中身</div>');
  expect(result).toContain("導入の文。");
});

test("stripDirectiveMarkers does not strip ::: inside a code fence", () => {
  const source = "前\n\n```md\n:::figure{title=秘密}\n中身\n:::\n```\n\n後\n";
  const result = stripDirectiveMarkers(source);
  expect(result).toContain(":::figure{title=秘密}");
  expect(result).toContain("中身");
  expect(result).toContain("```");
});

test("extractPlainText keeps directive body and x-post text, and drops markers", () => {
  const source = `:::x-post{href="https://x.com/n/1" author=nyatinte handle=nyatinte date="2026年11月14日" avatar=./a.jpg image=./b.png imageAlt="比較図"}
Claude Code に Code Mode 来たんだ
:::
`;
  const text = extractPlainText(source);
  expect(text).toContain("Claude Code に Code Mode 来たんだ");
  expect(text).toContain("比較図");
  expect(text).toContain("nyatinte");
  expect(text).not.toContain(":::");
  expect(text).not.toContain("x-post");
});
