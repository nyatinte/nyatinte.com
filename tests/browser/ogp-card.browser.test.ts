import { expect, test } from "vite-plus/test";
import { createImageHtml } from "../../poc/takumi-workers/src/card";

test("browser parses achievement text as text, not markup", () => {
  const userText = '<img src=x onerror="alert(1)">';
  const html = createImageHtml(
    { fontSize: 40, lines: [userText], truncated: false },
    { fontSize: 26, lines: ["<script>alert(1)</script>"], truncated: false },
    { occurredAt: "2026-09-27", tags: ["<script>"] }
  );
  const card = document.createElement("div");
  card.innerHTML = html;

  expect(card.querySelector("img, script")).toBeNull();
  expect(card.textContent).toContain(userText);
  expect(card.textContent).toContain("<script>alert(1)</script>");
  expect(card.textContent).toContain("<script>");
});
