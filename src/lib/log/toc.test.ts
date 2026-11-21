import { describe, expect, it } from "vite-plus/test";
import { extractHeadings, slugifyHeading } from "./toc";

describe("記事の目次", () => {
  it("日本語タイトルと句読点の場合にURL で安全かつ安定した値になる", () => {
    // Given: 日本語タイトルと句読点
    // When: slug を生成すると
    // Then
    expect(slugifyHeading("置き場所：記事の作り方！")).toBe(
      "置き場所記事の作り方"
    );
    expect(slugifyHeading("   !!!   ")).toBe("section");
  });

  it("frontmatter と fenced code を含む本文の場合にh2 と h3 だけを抽出する", () => {
    // Given: frontmatter と fenced code を含む本文
    // When: 目次を作ると
    // Then
    expect(
      extractHeadings(
        "---\ntitle: Hidden\n---\n# Top\n## 概要\n#### Too deep\n\n\x60\x60\x60md\n## Hidden code\n\x60\x60\x60\n### 詳細"
      )
    ).toEqual([
      { depth: 2, id: "概要", title: "概要" },
      { depth: 3, id: "詳細", title: "詳細" },
    ]);
  });

  it("同じ見出しが重複するとき、衝突回避用の suffix を付ける", () => {
    // Given: 同じ見出しが重複するとき
    // When: slug を作ると
    // Then
    expect(
      extractHeadings("## !!!\n## ???\n## !!!\n## A B\n## A-B").map(
        ({ id }) => id
      )
    ).toEqual(["section", "section-1", "section-2", "a-b", "a-b-1"]);
  });
});
