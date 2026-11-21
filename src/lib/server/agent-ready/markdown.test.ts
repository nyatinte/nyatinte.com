import { expect, test } from "vite-plus/test";
import { canonicalSiteUrl } from "./constants";
import { renderAgentMarkdown } from "./markdown";

test("トップページの場合にページ内容を返す", () => {
  // Given: トップページ
  // When: Markdown を描画すると
  const rendered = renderAgentMarkdown({ canonicalPath: "/", kind: "home" });
  // Then
  expect(rendered.status).toBe(200);
  expect(rendered.body).toContain("# nyatinte");
  expect(rendered.body).toContain(`[ログ](${canonicalSiteUrl("/log")})`);
});

test("存在しないページの場合に404 とエラーメッセージを返す", () => {
  // Given: 存在しないページ
  // When: Markdown を描画すると
  const rendered = renderAgentMarkdown({
    canonicalPath: "/missing",
    kind: "not-found",
  });
  // Then
  expect(rendered.status).toBe(404);
  expect(rendered.body).toContain("ページが見つかりません");
});

test("存在しない記事の場合に404 とエラーメッセージを返す", () => {
  // Given: 存在しない記事
  // When: Markdown を描画すると
  const rendered = renderAgentMarkdown({
    canonicalPath: "/log/missing",
    kind: "log-detail",
    slug: "missing",
  });
  // Then
  expect(rendered.status).toBe(404);
  expect(rendered.body).toContain("記事が見つかりません");
});

test("公開記事の場合に記事本文を返す", () => {
  // Given: 公開記事
  // When: Markdown を描画すると
  const rendered = renderAgentMarkdown({
    canonicalPath: "/log/template",
    kind: "log-detail",
    slug: "template",
  });
  // Then
  expect(rendered.status).toBe(200);
  expect(rendered.body).toContain("# わからなかったことを調べて書く");
  expect(rendered.body).toContain(`[ログへ](${canonicalSiteUrl("/log")})`);
});
