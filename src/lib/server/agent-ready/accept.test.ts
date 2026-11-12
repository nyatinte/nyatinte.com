import { expect, test } from "vite-plus/test";
import { prefersMarkdown, wantsMarkdown } from "./accept";

test("prefers markdown only when its q-value beats text/html", () => {
  expect(prefersMarkdown("text/markdown")).toBe(true);
  expect(prefersMarkdown("text/markdown, text/html;q=0.9")).toBe(true);
  expect(prefersMarkdown("text/html, text/markdown;q=0.1")).toBe(false);
  expect(prefersMarkdown("text/html")).toBe(false);
  expect(prefersMarkdown("*/*")).toBe(false);
});

test("wantsMarkdown reads the Accept request header", () => {
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
