import { expect, test } from "vite-plus/test";
import { prefersMarkdown, wantsMarkdown } from "./accept";

test("Accept の q 値の場合にMarkdown の q 値が高い場合だけ優先する", () => {
  // Given: Accept の q 値
  // When: Markdown と HTML の優先度を判定すると
  // Then
  expect(prefersMarkdown("text/markdown")).toBe(true);
  expect(prefersMarkdown("text/markdown, text/html;q=0.9")).toBe(true);
  expect(prefersMarkdown("text/html, text/markdown;q=0.1")).toBe(false);
  expect(prefersMarkdown("text/html")).toBe(false);
  expect(prefersMarkdown("*/*")).toBe(false);
});

test("HTTP リクエストの場合にAccept ヘッダーを読む", () => {
  // Given: HTTP リクエスト
  // When: Markdown 希望を調べると
  // Then
  expect(
    wantsMarkdown(
      new Request("https://example.com/", {
        headers: { Accept: "text/markdown" },
      })
    )
  ).toBe(true);
  expect(
    wantsMarkdown(
      new Request("https://example.com/", {
        headers: { Accept: "text/html, text/markdown;q=0.1" },
      })
    )
  ).toBe(false);
});
