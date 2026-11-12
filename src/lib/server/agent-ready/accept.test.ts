import { expect, test } from "vite-plus/test";
import { acceptIncludesMarkdown, wantsMarkdown } from "./accept";

test("detects text/markdown and */* media ranges", () => {
  expect(acceptIncludesMarkdown("text/markdown")).toBe(true);
  expect(acceptIncludesMarkdown("text/markdown, text/html;q=0.9")).toBe(true);
  expect(acceptIncludesMarkdown("*/*")).toBe(false);
  expect(acceptIncludesMarkdown("text/html")).toBe(false);
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
        headers: { Accept: "text/html" },
      })
    )
  ).toBe(false);
});
