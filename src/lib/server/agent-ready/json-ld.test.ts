import { expect, test } from "vite-plus/test";
import { getArticle } from "../../log/articles";
import { siteIdentity } from "./constants";
import { createArticleJsonLd, createHomeJsonLd } from "./json-ld";

test("Given トップページの JSON-LD、When 説明文を組み立てると、Then Person と WebSite で meta description を共有する", () => {
  const graphs = createHomeJsonLd();
  const person = graphs.find((graph) => graph["@type"] === "Person");
  const website = graphs.find((graph) => graph["@type"] === "WebSite");
  expect(person?.description).toBe(siteIdentity.description);
  expect(website?.description).toBe(siteIdentity.description);
});

test("Given 記事の frontmatter、When JSON-LD を生成すると、Then title と date を使う", () => {
  const article = getArticle("template");
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
