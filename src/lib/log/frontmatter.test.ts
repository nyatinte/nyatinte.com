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

test("必須の frontmatterの場合に元のソースを保持する", () => {
  // Given: 必須の frontmatter
  // When: 記事を読み込むと
  const article = parseArticleSource("template.md", valid);
  // Then
  expect(article).toMatchObject({
    date: "2026-11-12",
    description: "分かったことを書く。",
    slug: "template",
    title: "調べたこと",
  });
  expect(article.source).toBe(valid);
  expect(article.body.trim()).toBe("本文");
});

test("svx ファイルの updated と imageの場合に任意項目として受け入れる", () => {
  // Given: svx ファイルの updated と image
  // When: frontmatter を読むと
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
  // Then
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
])(
  "不正な frontmatter を持つ記事を拒否する: %s",
  (filename, source, expected) => {
    // Given: 必須項目の不足や日付・ファイル名に問題がある記事
    // When: frontmatter を解析する
    const parse = () => parseArticleSource(filename, source);
    // Then: 問題のある項目を示して失敗する
    expect(parse).toThrow(expected);
  }
);

test("複数の記事の場合に新しい日付順にする", () => {
  // Given: 複数の記事
  // When: 並べ替えると
  const older = parseArticleSource(
    "older.md",
    valid.replace("2026-11-12", "2026-01-01").replace("調べたこと", "古い")
  );
  const newer = parseArticleSource(
    "newer.md",
    valid.replace("調べたこと", "新しい")
  );
  // Then
  expect(
    sortArticlesNewestFirst([older, newer]).map((article) => article.slug)
  ).toEqual(["newer", "older"]);
});

test("重複する slugの場合にエラーにする", () => {
  // Given: 重複する slug
  // When: 記事を読み込むと
  // Then
  expect(() =>
    articlesFromSources({
      "same.md": valid,
      "same.svx": valid,
    })
  ).toThrow("Duplicate article slug: same");
});

test("frontmatter が不正な記事を含むディレクトリの場合に検証に失敗する", () => {
  // Given: frontmatter が不正な記事を含むディレクトリ
  // When: 読み込むと
  const directory = mkdtempSync(join(tmpdir(), "log-"));
  mkdirSync(join(directory, "broken"));
  writeFileSync(
    join(directory, "broken", "index.md"),
    "---\ntitle: 題\ndate: 2026-11-12\n---\n"
  );
  // Then
  expect(() => loadArticlesFromDirectory(directory)).toThrow(
    "invalid frontmatter"
  );
});

test("記事ディレクトリの名前を slug にし、画像の存在も検証する", () => {
  // Given: ./og.jpg を指定した記事と、まだ画像がない記事ディレクトリ
  const directory = mkdtempSync(join(tmpdir(), "log-"));
  mkdirSync(join(directory, "my-post"));
  writeFileSync(
    join(directory, "my-post", "index.md"),
    valid.replace("---\n\n本文", "image: ./og.jpg\n---\n\n本文")
  );
  // When: 画像がない状態で記事を読み込む
  // Then: 画像が見つからずエラーになる
  expect(() => loadArticlesFromDirectory(directory)).toThrow("image not found");

  // When: 画像を置いて再度読み込む
  writeFileSync(join(directory, "my-post", "og.jpg"), "image");
  const [article] = loadArticlesFromDirectory(directory);
  // Then: ディレクトリ名を slug として読み込む
  expect(article).toMatchObject({ image: "./og.jpg", slug: "my-post" });
});

test("記事ディレクトリ内の index ファイルが重複したら拒否する", () => {
  // Given: index.md と index.svx の両方を含む記事ディレクトリ
  const directory = mkdtempSync(join(tmpdir(), "log-"));
  mkdirSync(join(directory, "my-post"));
  writeFileSync(join(directory, "my-post", "index.md"), valid);
  writeFileSync(join(directory, "my-post", "index.svx"), valid);
  // When: ディレクトリから記事を読み込む
  const load = () => loadArticlesFromDirectory(directory);
  // Then: 重複 slug のエラーになる
  expect(load).toThrow("Duplicate article slug: my-post");
});

test("公開中のログディレクトリが有効である", () => {
  // Given: 公開中のログディレクトリ
  // When: 記事を読み込む
  const articles = loadArticlesFromDirectory(
    join(process.cwd(), "src/content/log")
  );
  // Then: template 記事が含まれる
  expect(articles.map((article) => article.slug)).toContain("template");
});
