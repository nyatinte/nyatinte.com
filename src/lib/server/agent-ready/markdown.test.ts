import { expect, test } from "vite-plus/test";
import { canonicalSiteUrl } from "./constants";
import { renderAgentMarkdown } from "./markdown";

test("renders markdown for the home page", () => {
  const rendered = renderAgentMarkdown({ canonicalPath: "/", kind: "home" });
  expect(rendered.status).toBe(200);
  expect(rendered.body).toContain("# nyatinte");
  expect(rendered.body).toContain(`[ログ](${canonicalSiteUrl("/log")})`);
});

test("renders markdown for unknown pages with a 404 status", () => {
  const rendered = renderAgentMarkdown({
    canonicalPath: "/missing",
    kind: "not-found",
  });
  expect(rendered.status).toBe(404);
  expect(rendered.body).toContain("ページが見つかりません");
});

test("renders markdown for missing articles with a 404 status", () => {
  const rendered = renderAgentMarkdown({
    canonicalPath: "/log/missing",
    kind: "log-detail",
    slug: "missing",
  });
  expect(rendered.status).toBe(404);
  expect(rendered.body).toContain("記事が見つかりません");
});

test("renders the sample article as markdown", () => {
  const rendered = renderAgentMarkdown({
    canonicalPath: "/log/template",
    kind: "log-detail",
    slug: "template",
  });
  expect(rendered.status).toBe(200);
  expect(rendered.body).toContain("# わからなかったことを調べて書く");
  expect(rendered.body).toContain(`[ログへ](${canonicalSiteUrl("/log")})`);
});
