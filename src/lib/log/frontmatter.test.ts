import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import { loadArticlesFromDirectory } from "./directory";
import {
  articlesFromSources,
  parseArticleSource,
  sortArticlesNewestFirst,
} from "./frontmatter";

const valid = `---
title: 調べたこと
description: 分かったことを書く。
date: 2026-11-12
---

本文
`;

test("reads required frontmatter and keeps the raw source", () => {
  const article = parseArticleSource("template.md", valid);
  expect(article).toMatchObject({
    date: "2026-11-12",
    description: "分かったことを書く。",
    slug: "template",
    title: "調べたこと",
  });
  expect(article.source).toBe(valid);
  expect(article.body.trim()).toBe("本文");
});

test("accepts optional updated and image fields on svx files", () => {
  const article = parseArticleSource(
    "with-image.svx",
    `---
title: 画像つき
description: OGP 用のパスを持つ。
date: 2026-01-02
updated: 2026-02-03
image: /images/og.png
---
`
  );
  expect(article).toMatchObject({
    image: "/images/og.png",
    slug: "with-image",
    updated: "2026-02-03",
  });
});

test.each([
  ["note.md", "---\ndescription: 説明\ndate: 2026-11-12\n---\n", "title"],
  [
    "note.md",
    "---\ntitle: 題\ndescription: 説明\ndate: 2026-02-31\n---\n",
    "date",
  ],
  [
    "note.md",
    "---\ntitle: 題\ndescription: 説明\ndate: 2026-11-12\nextra: 1\n---\n",
    "extra",
  ],
  ["Note.md", valid, "file name"],
  ["note.txt", valid, "file name"],
  ["note.md", "本文だけ", "frontmatter"],
  [
    "note.md",
    "---\ntitle: 題\ndescription: 説明\ndate: 2026-11-12\nupdated: 2026-11-11\n---\n",
    "updated",
  ],
])("rejects invalid article %s", (filename, source, expected) => {
  expect(() => parseArticleSource(filename, source)).toThrow(expected);
});

test("sorts articles newest first", () => {
  const older = parseArticleSource(
    "older.md",
    valid.replace("2026-11-12", "2026-01-01").replace("調べたこと", "古い")
  );
  const newer = parseArticleSource(
    "newer.md",
    valid.replace("調べたこと", "新しい")
  );
  expect(
    sortArticlesNewestFirst([older, newer]).map((article) => article.slug)
  ).toEqual(["newer", "older"]);
});

test("rejects duplicate slugs", () => {
  expect(() =>
    articlesFromSources({
      "same.md": valid,
      "same.svx": valid,
    })
  ).toThrow("Duplicate article slug: same");
});

test("a directory of invalid frontmatter fails validation", () => {
  const directory = mkdtempSync(join(tmpdir(), "log-"));
  mkdirSync(join(directory, "broken"));
  writeFileSync(
    join(directory, "broken", "index.md"),
    "---\ntitle: 題\ndate: 2026-11-12\n---\n"
  );
  expect(() => loadArticlesFromDirectory(directory)).toThrow(
    "invalid frontmatter"
  );
});

test("article directories use their directory name as the slug", () => {
  const directory = mkdtempSync(join(tmpdir(), "log-"));
  mkdirSync(join(directory, "my-post"));
  writeFileSync(
    join(directory, "my-post", "index.md"),
    valid.replace("---\n\n本文", "image: ./og.jpg\n---\n\n本文")
  );
  expect(() => loadArticlesFromDirectory(directory)).toThrow("image not found");
  writeFileSync(join(directory, "my-post", "og.jpg"), "image");
  expect(loadArticlesFromDirectory(directory)[0]).toMatchObject({
    image: "./og.jpg",
    slug: "my-post",
  });
});

test("rejects duplicate index files in an article directory", () => {
  const directory = mkdtempSync(join(tmpdir(), "log-"));
  mkdirSync(join(directory, "my-post"));
  writeFileSync(join(directory, "my-post", "index.md"), valid);
  writeFileSync(join(directory, "my-post", "index.svx"), valid);
  expect(() => loadArticlesFromDirectory(directory)).toThrow(
    "Duplicate article slug: my-post"
  );
});

test("the published log directory is valid", () => {
  const articles = loadArticlesFromDirectory(
    join(process.cwd(), "src/content/log")
  );
  expect(articles.map((article) => article.slug)).toContain("template");
});
