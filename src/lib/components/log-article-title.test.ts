import { render } from "svelte/server";
import { expect, test } from "vite-plus/test";
import LogArticleTitle from "./log-article-title.svelte";

const headingLinkPattern =
  /<h2[^>]*>\s*<a\b[^>]*\bhref="\/log\/example"[^>]*>例の記事<\/a>\s*<\/h2>/u;
const viewTransitionStylePattern =
  /style="[^"]*view-transition-name:\s*article-example/u;

test("renders the article title as a heading link", () => {
  const { body } = render(LogArticleTitle, {
    props: { href: "/log/example", title: "例の記事" },
  });

  expect(body).toMatch(headingLinkPattern);
});

test("names the view transition when a transition name is given", () => {
  const { body } = render(LogArticleTitle, {
    props: {
      href: "/log/example",
      title: "例の記事",
      transitionName: "article-example",
    },
  });

  expect(body).toMatch(viewTransitionStylePattern);
});

test("omits the view transition when no transition name is given", () => {
  const { body } = render(LogArticleTitle, {
    props: { href: "/log/example", title: "例の記事" },
  });

  expect(body).not.toContain("view-transition-name");
  expect(body).not.toContain("style=");
});
