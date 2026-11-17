import { expect, test } from "vite-plus/test";
import { getArticle } from "../../log/articles";
import { siteIdentity } from "./constants";
import { createArticleJsonLd, createHomeJsonLd } from "./json-ld";

test("トップページの JSON-LDの場合にPerson と WebSite で meta description を共有する", () => {
  // Given: トップページの JSON-LD
  // When: 説明文を組み立てると
  const graphs = createHomeJsonLd();
  const person = graphs.find((graph) => graph["@type"] === "Person");
  const website = graphs.find((graph) => graph["@type"] === "WebSite");
  // Then
  expect(person?.description).toBe(siteIdentity.description);
  expect(website?.description).toBe(siteIdentity.description);
});

test("記事の frontmatterの場合にtitle と date を使う", () => {
  // Given: 記事の frontmatter
  // When: JSON-LD を生成すると
  const article = getArticle("template");
  // Then
  expect(article).toBeDefined();
  if (!article) {
    return;
  }
  const [graph] = createArticleJsonLd(article);
  expect(graph["@type"]).toBe("BlogPosting");
  expect(graph.headline).toBe(article.title);
  expect(graph.datePublished).toBe(article.date);
  expect(graph.url).toBe("https://nyatinte.com/log/template");
});
