import { expect, test } from "vite-plus/test";
import { renderAgentMarkdown } from "./markdown";

test("renders markdown for the home page", async () => {
  const rendered = await renderAgentMarkdown(
    { canonicalPath: "/", kind: "home" },
    "https://nyatinte.com",
    new URLSearchParams()
  );
  expect(rendered.status).toBe(200);
  expect(rendered.body).toContain("# nyatinte");
  expect(rendered.body).toContain("[やったこと](https://nyatinte.com/done)");
});

test("renders markdown for unknown pages with a 404 status", async () => {
  const rendered = await renderAgentMarkdown(
    { canonicalPath: "/missing", kind: "not-found" },
    "https://nyatinte.com",
    new URLSearchParams()
  );
  expect(rendered.status).toBe(404);
  expect(rendered.body).toContain("ページが見つかりません");
});

test("renders markdown for missing achievements with a 404 status", async () => {
  const rendered = await renderAgentMarkdown(
    {
      canonicalPath: "/done/missing",
      kind: "done-detail",
      slug: "missing",
    },
    "https://nyatinte.com",
    new URLSearchParams()
  );
  expect(rendered.status).toBe(404);
  expect(rendered.body).toContain("実績が見つかりません");
});
