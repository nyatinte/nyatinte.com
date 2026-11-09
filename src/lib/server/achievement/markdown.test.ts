import { expect, test } from "vite-plus/test";
import { renderMarkdown } from "./markdown";

test("renders the markdown blocks used in achievement details", () => {
  const html = renderMarkdown(
    "# Heading\n\n- item\n\n```ts\nconst answer = 42;\n```\n\n[link](https://example.com)\n\n![diagram](https://example.com/diagram.png)"
  );

  expect(html).toContain("<h2>Heading</h2>");
  expect(html).toContain("<ul>");
  expect(html).toContain("<pre><code");
  expect(html).toContain('href="https://example.com"');
  expect(html).toContain('src="https://example.com/diagram.png"');
});

test("removes raw HTML and unsafe URL protocols", () => {
  const html = renderMarkdown(
    '<script>alert("x")</script>\n\n[run](javascript:alert%281%29)'
  );

  expect(html).not.toContain("<script>");
  expect(html).not.toContain("javascript:");
});
