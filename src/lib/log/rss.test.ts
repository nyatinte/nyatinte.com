import { expect, test } from "vite-plus/test";
import type { Article } from "./frontmatter";
import { buildRssXml } from "./rss";

function article(overrides: Partial<Article> & { slug: string }): Article {
  return {
    body: "",
    date: "2025-01-02",
    description: "説明",
    source: "",
    title: "タイトル",
    ...overrides,
  };
}

test("produces a channel that feed readers can subscribe to", () => {
  const xml = buildRssXml([article({ slug: "a" })]);

  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  expect(xml).toContain(
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">'
  );
  expect(xml).toContain("<title>ログ | nyatinte.com</title>");
  expect(xml).toContain("<link>https://nyatinte.com/log</link>");
  expect(xml).toContain(
    "<description>わからなかったことを調べて書く。</description>"
  );
  expect(xml).toContain("<language>ja</language>");
  expect(xml).toContain(
    '<atom:link href="https://nyatinte.com/log/rss.xml" rel="self" type="application/rss+xml" />'
  );
  expect(xml).toContain(
    "<lastBuildDate>Thu, 02 Jan 2025 00:00:00 GMT</lastBuildDate>"
  );
});

test("emits one item per article with an RFC 822 date", () => {
  const xml = buildRssXml([
    article({ date: "2025-01-02", slug: "a", title: "タイトル A" }),
    article({ date: "2024-12-31", description: "説明 B", slug: "b" }),
  ]);

  expect(xml.match(/<item>/gu)).toHaveLength(2);
  expect(xml).toContain("<title>タイトル A</title>");
  expect(xml).toContain("<link>https://nyatinte.com/log/a</link>");
  expect(xml).toContain(
    '<guid isPermaLink="true">https://nyatinte.com/log/a</guid>'
  );
  expect(xml).toContain("<pubDate>Thu, 02 Jan 2025 00:00:00 GMT</pubDate>");
  expect(xml).toContain("<pubDate>Tue, 31 Dec 2024 00:00:00 GMT</pubDate>");
  expect(xml).toContain("<description>説明 B</description>");
});

test("escapes XML special characters in text and attributes", () => {
  const xml = buildRssXml([
    article({
      description: `A & B <tag> "q" 'p'`,
      slug: "a",
      title: `A & B <tag> "q" 'p'`,
    }),
  ]);

  expect(xml).toContain(
    "<title>A &amp; B &lt;tag&gt; &quot;q&quot; &apos;p&apos;</title>"
  );
  expect(xml).toContain(
    "<description>A &amp; B &lt;tag&gt; &quot;q&quot; &apos;p&apos;</description>"
  );
  expect(xml).not.toContain("<tag>");
});

test("uses the newest updated date for lastBuildDate", () => {
  const xml = buildRssXml([
    article({ date: "2025-01-02", slug: "a" }),
    article({ date: "2024-12-31", slug: "b", updated: "2025-03-04" }),
  ]);

  expect(xml).toContain(
    "<lastBuildDate>Tue, 04 Mar 2025 00:00:00 GMT</lastBuildDate>"
  );
  expect(xml).toContain("<pubDate>Tue, 31 Dec 2024 00:00:00 GMT</pubDate>");
});

test("keeps the feed valid when there are no articles", () => {
  const xml = buildRssXml([]);

  expect(xml).not.toContain("<item>");
  expect(xml).not.toContain("<lastBuildDate>");
  expect(xml).toContain("<language>ja</language>");
  expect(xml.trimEnd().endsWith("</rss>")).toBe(true);
});
