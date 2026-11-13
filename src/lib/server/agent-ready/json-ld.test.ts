import { expect, test } from "vite-plus/test";
import { getArticle } from "../../log/articles";
import { siteIdentity } from "./constants";
import { createArticleJsonLd, createHomeJsonLd } from "./json-ld";

test("home JSON-LD reuses the site meta description on Person and WebSite", () => {
  const graphs = createHomeJsonLd();
  const person = graphs.find((graph) => graph["@type"] === "Person");
  const website = graphs.find((graph) => graph["@type"] === "WebSite");
  expect(person?.description).toBe(siteIdentity.description);
  expect(website?.description).toBe(siteIdentity.description);
});

test("article JSON-LD uses the frontmatter title and date", () => {
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
