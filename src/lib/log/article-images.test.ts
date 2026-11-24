import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import {
  articleBodyImageIssues,
  assertArticleBodyImages,
  localArticleImagePaths,
} from "./article-images";
import { loadArticlesFromDirectory } from "./directory";

const validBody = `本文に図を置く。

![ターミナルの出力](./terminal-output.webp)
`;

test("accepts a markdown image with alt text in the article directory", () => {
  expect(articleBodyImageIssues(validBody)).toEqual([]);
  expect(localArticleImagePaths(validBody)).toEqual(["./terminal-output.webp"]);
  expect(() => assertArticleBodyImages("example.md", validBody)).not.toThrow();
});

test("rejects a markdown image without alternative text", () => {
  const issues = articleBodyImageIssues("![](./terminal-output.webp)\n");
  expect(issues).toEqual([
    {
      message:
        "Markdown image needs alternative text: ![](./terminal-output.webp)",
    },
  ]);
});

test("rejects a body image that reuses the OGP filename", () => {
  expect(articleBodyImageIssues("![og](./og.png)\n")).toEqual([
    { message: "Article body must not reuse the OGP image: ./og.png" },
  ]);
});

test("rejects a remote or site-root markdown image", () => {
  const remote = articleBodyImageIssues(
    "![図](https://example.com/shot.webp)\n",
  );
  expect(remote[0]?.message).toContain(
    "Markdown image must be a file in the article directory",
  );
  const rooted = articleBodyImageIssues("![図](/images/shot.webp)\n");
  expect(rooted[0]?.message).toContain(
    "Markdown image must be a file in the article directory",
  );
});

test("ignores images inside fenced code", () => {
  const body = `説明

\`\`\`md
![](https://example.com/shot.webp)
\`\`\`
`;
  expect(articleBodyImageIssues(body)).toEqual([]);
});

test("accepts a decorative site-chrome img with dimensions", () => {
  const body = `<img src="/images/chick-penguin.png" alt="" width="90" height="128" />\n`;
  expect(articleBodyImageIssues(body)).toEqual([]);
});

test("accepts an img that uses a Svelte src expression", () => {
  const body = `<img alt="投稿画像" src={photo} width="1200" height="630" />\n`;
  expect(articleBodyImageIssues(body)).toEqual([]);
});

test("rejects an img without alt, dimensions, or a local source", () => {
  expect(
    articleBodyImageIssues(
      '<img src="./shot.webp" width="800" height="400" />\n',
    ),
  ).toEqual([
    {
      message:
        'img needs an alt attribute: <img src="./shot.webp" width="800" height="400" />',
    },
  ]);
  expect(
    articleBodyImageIssues('<img alt="図" src="./shot.webp" />\n'),
  ).toEqual([
    {
      message:
        'img needs a numeric width and height: <img alt="図" src="./shot.webp" />',
    },
  ]);
  expect(
    articleBodyImageIssues(
      '<img alt="図" src="https://example.com/shot.webp" width="800" height="400" />\n',
    ),
  ).toEqual([
    {
      message:
        "img source must be a local article file, site chrome, or a Svelte expression: https://example.com/shot.webp",
    },
  ]);
});

test("fails the article directory when a body image file is missing", () => {
  const directory = mkdtempSync(join(tmpdir(), "log-"));
  mkdirSync(join(directory, "my-post"));
  writeFileSync(
    join(directory, "my-post", "index.md"),
    `---
title: 調べたこと
description: 分かったことを書く。
date: 2026-11-12
---

![図](./terminal-output.webp)
`,
  );
  expect(() => loadArticlesFromDirectory(directory)).toThrow(
    "image not found: ./terminal-output.webp",
  );
  writeFileSync(join(directory, "my-post", "terminal-output.webp"), "image");
  expect(loadArticlesFromDirectory(directory)[0]?.slug).toBe("my-post");
});

test("the published log directory satisfies the body image rules", () => {
  expect(() =>
    loadArticlesFromDirectory(join(process.cwd(), "src/content/log")),
  ).not.toThrow();
});
