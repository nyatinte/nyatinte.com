import { expect, test } from "vite-plus/test";
import { createImageHtml } from "./card";

const layout = (line: string) => ({
  fontSize: 26,
  lines: [line],
  truncated: false,
});

test("uses the achievement date instead of a fixed fixture date", () => {
  const html = createImageHtml(layout("タイトル"), layout("一言"), {
    occurredAt: "2026-09-27",
    tags: ["Workers"],
  });

  expect(html).toContain("2026/09/27");
  expect(html).not.toContain("2026/09/26");
});

test("escapes dynamic title, summary, and tag text", () => {
  const html = createImageHtml(
    layout('<img src=x onerror="alert(1)">'),
    layout("A & B <script>alert(1)</script>"),
    { occurredAt: "2026-09-27", tags: ["<script>"] }
  );

  expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  expect(html).toContain("A &amp; B &lt;script&gt;alert(1)&lt;/script&gt;");
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain('<img src=x onerror="alert(1)">');
});

test("rejects invalid achievement dates", () => {
  expect(() =>
    createImageHtml(layout("タイトル"), layout("一言"), {
      occurredAt: "2026-02-30",
      tags: [],
    })
  ).toThrow("Expected a valid YYYY-MM-DD date");
});
