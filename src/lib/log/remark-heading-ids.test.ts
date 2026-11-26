import { mdsvex } from "mdsvex";
import { expect, test } from "vite-plus/test";
import { remarkHeadingIds } from "./remark-heading-ids";

async function compile(content: string) {
  const result = await mdsvex({
    extensions: [".md"],
    highlight: false,
    remarkPlugins: [remarkHeadingIds],
    smartypants: false,
  }).markup({ content, filename: "example.md" });
  return result?.code ?? "";
}

test("h2 と h3 の見出しテキストの右に同じ id のセクションリンクを付ける", async () => {
  const code = await compile("## 概要\n\n### 詳細\n");

  expect(code).toMatch(
    /<h2 id="概要">概要<a href="#概要" aria-label="『概要』へのリンク" class="heading-anchor"><\/a><\/h2>/u,
  );
  expect(code).toMatch(
    /<h3 id="詳細">詳細<a href="#詳細" aria-label="『詳細』へのリンク" class="heading-anchor"><\/a><\/h3>/u,
  );
});

test("重複する見出しは衝突サフィックス付きの id とリンクになる", async () => {
  const code = await compile("## 概要\n\n## 概要\n");

  expect(code).toContain('<h2 id="概要">');
  expect(code).toContain('<h2 id="概要-1">');
  expect(code).toContain('href="#概要"');
  expect(code).toContain('href="#概要-1"');
});

test("h1 と h4 の見出しにはセクションリンクを付けない", async () => {
  const code = await compile("# 見出し\n\n#### 深い見出し\n");

  expect(code).not.toContain("heading-anchor");
});
