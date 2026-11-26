import { applyPatch } from "diff";
import { expect, test } from "vite-plus/test";
import { applyEdits, createArticlePatch, extractBlocks } from "./preview-edit";

const source = `---
title: 編集テスト
description: 説明
date: 2026-01-01
---

# 見出し

段落。

- 項目

> 引用

\`\`\`ts
const a = 1;
\`\`\`

<div>HTML</div>

:::figure{title="図"}
本文
:::

![画像](./image.png)

---

最後の段落。
`;

test("extracts editable and non-editable top-level blocks with source slices", () => {
  const blocks = extractBlocks(source);
  expect(blocks.map((block) => [block.text, block.editable])).toEqual([
    ["# 見出し", true],
    ["段落。", true],
    ["- 項目", true],
    ["> 引用", true],
    ["```ts\nconst a = 1;\n```", false],
    ["<div>HTML</div>", false],
    [':::figure{title="図"}\n本文\n:::', false],
    ["![画像](./image.png)", false],
    ["---", false],
    ["最後の段落。", true],
  ]);
  expect(blocks[0]?.start).toBe(source.indexOf("# 見出し"));
  for (const block of blocks) {
    expect(source.slice(block.start, block.end)).toBe(block.text);
  }
});

test("excludes frontmatter from extracted blocks", () => {
  const blocks = extractBlocks(source);
  expect(
    blocks.every((block) => block.start >= source.indexOf("# 見出し")),
  ).toBe(true);
  expect(blocks.map((block) => block.text).join("\n")).not.toContain("title:");
});

test("applies edits from the end and ignores non-editable blocks", () => {
  const blocks = extractBlocks(source);
  const heading = blocks.findIndex((block) => block.text === "# 見出し");
  const paragraph = blocks.findIndex((block) => block.text === "段落。");
  const code = blocks.findIndex((block) => block.text.startsWith("```ts"));
  const after = applyEdits(
    source,
    new Map([
      [heading, "## 変更した見出し"],
      [paragraph, "変更した段落。"],
      [code, "変更できない"],
    ]),
  );
  expect(after).toContain("## 変更した見出し");
  expect(after).toContain("変更した段落。");
  expect(after).toContain("```ts\nconst a = 1;\n```");
  expect(after).not.toContain("変更できない");
});

test("creates a git-apply-able patch with preview headers", () => {
  const blocks = extractBlocks(source);
  const paragraph = blocks.findIndex((block) => block.text === "段落。");
  const after = applyEdits(source, new Map([[paragraph, "変更した段落。"]]));
  const patch = createArticlePatch({
    after,
    before: source,
    pr: "123",
    sha: "abcdef1234567890",
    slug: "sample",
  });
  expect(patch).not.toBeNull();
  if (patch === null) {
    throw new Error("patch was not created");
  }
  expect(patch.startsWith("# PR #123 @ abcdef1\n--- a/")).toBe(true);
  expect(patch).toContain("--- a/src/content/log/sample/index.svx");
  expect(patch).toContain("+++ b/src/content/log/sample/index.svx");
  expect(patch).not.toContain("\n===");
  expect(patch).not.toMatch(/^(?:---|\+\+\+) .*\t$/mu);
  expect(applyPatch(source, patch)).toBe(after);
});

test("omits an unchanged patch and missing header parts", () => {
  expect(
    createArticlePatch({
      after: source,
      before: source,
      pr: "123",
      sha: "abcdef1",
      slug: "sample",
    }),
  ).toBeNull();

  const blocks = extractBlocks(source);
  const paragraph = blocks.findIndex((block) => block.text === "段落。");
  const after = applyEdits(source, new Map([[paragraph, "変更した段落。"]]));
  const patch = createArticlePatch({
    after,
    before: source,
    pr: "7",
    slug: "sample",
  });
  expect(patch?.startsWith("# PR #7\n--- a/")).toBe(true);
});
