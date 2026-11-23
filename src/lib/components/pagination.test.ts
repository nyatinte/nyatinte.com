import { render } from "svelte/server";
import { expect, test } from "vite-plus/test";
import Pagination from "./pagination.svelte";

const anchorPattern = /<a\s+([^>]+)>([^<]*)<\/a>/gu;
const hrefAttrPattern = /\bhref="([^"]+)"/u;
const relAttrPattern = /\brel="([^"]+)"/u;
const currentPagePattern =
  /<span[^>]*\baria-current="page"[^>]*>(\d+)<span[^>]*>ページ目<\/span><\/span>/u;

function anchorsIn(html: string) {
  return [...html.matchAll(anchorPattern)].map(([, attrs = "", text = ""]) => ({
    href: attrs.match(hrefAttrPattern)?.[1],
    rel: attrs.match(relAttrPattern)?.[1],
    text: text.trim(),
  }));
}

test("renders page 1 of a two-page pagination nav", () => {
  const { body } = render(Pagination, {
    props: { currentPage: 1, totalPages: 2 },
  });

  expect(body).toContain('<nav aria-label="ページネーション"');
  expect(body.match(currentPagePattern)?.[1]).toBe("1");
  expect(anchorsIn(body)).toEqual([
    { href: "/log?page=2", rel: undefined, text: "2" },
    { href: "/log?page=2", rel: "next", text: "次へ" },
  ]);
});

test("renders page 2 of a two-page pagination nav", () => {
  const { body } = render(Pagination, {
    props: { currentPage: 2, totalPages: 2 },
  });

  expect(body.match(currentPagePattern)?.[1]).toBe("2");
  expect(anchorsIn(body)).toEqual([
    { href: "/log", rel: "prev", text: "前へ" },
    { href: "/log", rel: undefined, text: "1" },
  ]);
});
