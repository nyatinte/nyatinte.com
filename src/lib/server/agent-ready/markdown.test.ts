import { expect, test } from "vite-plus/test";
import { canonicalSiteUrl } from "./constants";
import { renderAgentMarkdown } from "./markdown";

test("Given トップページ、When Markdown を描画すると、Then ページ内容を返す", () => {
  const rendered = renderAgentMarkdown({ canonicalPath: "/", kind: "home" });
  expect(rendered.status).toBe(200);
  expect(rendered.body).toContain("# nyatinte");
  expect(rendered.body).toContain(`[ログ](${canonicalSiteUrl("/log")})`);
});

test("Given 存在しないページ、When Markdown を描画すると、Then 404 とエラーメッセージを返す", () => {
  const rendered = renderAgentMarkdown({
    canonicalPath: "/missing",
    kind: "not-found",
  });
  expect(rendered.status).toBe(404);
  expect(rendered.body).toContain("ページが見つかりません");
});

test("Given 存在しない記事、When Markdown を描画すると、Then 404 とエラーメッセージを返す", () => {
  const rendered = renderAgentMarkdown({
    canonicalPath: "/log/missing",
    kind: "log-detail",
    slug: "missing",
  });
  expect(rendered.status).toBe(404);
  expect(rendered.body).toContain("記事が見つかりません");
});

test("Given 公開記事、When Markdown を描画すると、Then 記事本文を返す", () => {
  const rendered = renderAgentMarkdown({
    canonicalPath: "/log/template",
    kind: "log-detail",
    slug: "template",
  });
  expect(rendered.status).toBe(200);
  expect(rendered.body).toContain("# わからなかったことを調べて書く");
  expect(rendered.body).toContain(`[ログへ](${canonicalSiteUrl("/log")})`);
});
