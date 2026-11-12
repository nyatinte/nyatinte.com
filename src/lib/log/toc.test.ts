import { describe, expect, it } from "vite-plus/test";
import { extractHeadings, slugifyHeading } from "./toc";

describe("heading table of contents", () => {
  it("creates stable URL-safe slugs for Japanese titles and punctuation", () => {
    expect(slugifyHeading("置き場所：記事の作り方！")).toBe(
      "置き場所記事の作り方"
    );
    expect(slugifyHeading("   !!!   ")).toBe("section");
  });

  it("ignores frontmatter and fenced code and extracts only h2/h3", () => {
    expect(
      extractHeadings(
        "---\ntitle: Hidden\n---\n# Top\n## 概要\n#### Too deep\n\n\x60\x60\x60md\n## Hidden code\n\x60\x60\x60\n### 詳細"
      )
    ).toEqual([
      { depth: 2, id: "概要", title: "概要" },
      { depth: 3, id: "詳細", title: "詳細" },
    ]);
  });

  it("adds collision suffixes including when section is repeated", () => {
    expect(
      extractHeadings("## !!!\n## ???\n## !!!\n## A B\n## A-B").map(
        ({ id }) => id
      )
    ).toEqual(["section", "section-1", "section-2", "a-b", "a-b-1"]);
  });
});
