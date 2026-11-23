import { expect, test } from "vite-plus/test";
import {
  canonicalSiteUrl,
  siteIdentity,
} from "../lib/server/agent-ready/constants";

const targetUrl =
  import.meta.env.VITE_HELLO_WORLD_URL ?? "http://127.0.0.1:8787";
const canonicalPattern = /<link href="([^"]+)" rel="canonical"/;
const ogImagePattern = /<meta content="([^"]+)" property="og:image"/;
const latinFontPattern =
  /href="([^"]+mplus1p-(?:regular|bold)-latin\.[^"]+\.woff2)"/gu;
const cspScriptSourcePattern = /(?:^|;)\s*script-src\s+([^;]+)/;
const cspNoncePattern = /'nonce-([^']+)'/;
const scriptTagPattern = /<script\b[^>]*>/gu;
const scriptSrcAttributePattern = /\ssrc\s*=/u;
const scriptNoncePattern = /\snonce="([^"]+)"/u;
const varyAcceptPattern = /accept/i;
const jsonLdScriptBodyPattern =
  /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
const publishedArticleSlugPattern =
  /<loc>https:\/\/nyatinte\.com\/log\/([a-z0-9-]+)<\/loc>/u;
const metaDescriptionPattern =
  /<meta content="([^"]*)" name="description"\s*\/?>/u;
const ogImageAltPattern =
  /<meta content="([^"]*)" property="og:image:alt"\s*\/?>/u;
const twitterImageAltPattern =
  /<meta content="([^"]*)" name="twitter:image:alt"\s*\/?>/u;
const backToTopButtonPattern =
  /<button[^>]*aria-label="ページの先頭へ戻る"[^>]*>/u;
const markdownAlternateHrefPattern =
  /<([^>]+)>;\s*rel="alternate";\s*type="text\/markdown"/;
const xIntentHrefPattern = /href="(https:\/\/x\.com\/intent\/post\?[^"]+)"/u;
const rssAutodiscoveryLinkPattern =
  /<link [^>]*href="https:\/\/nyatinte\.com\/log\/rss\.xml"[^>]*>/u;

function expectMarkdownAlternatePath(link: string | null, pathname: string) {
  expect(link).toContain('rel="alternate"');
  expect(link).toContain('type="text/markdown"');
  const href = link?.match(markdownAlternateHrefPattern)?.[1];
  expect(href).toBeDefined();
  const parsed = new URL(href ?? "");
  expect(parsed.pathname).toBe(pathname);
  const allowedHosts = new Set(["nyatinte.com", new URL(targetUrl).hostname]);
  expect(allowedHosts.has(parsed.hostname)).toBe(true);
}

function nonceFrom(response: Response): string {
  const csp = response.headers.get("content-security-policy");
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  const scriptSource = csp?.match(cspScriptSourcePattern)?.[1];
  expect(scriptSource).toContain("'self'");
  expect(scriptSource).not.toContain("'unsafe-inline'");
  const nonce = scriptSource?.match(cspNoncePattern)?.[1];
  expect(nonce).toBeTruthy();
  return nonce ?? "";
}

function jsonLdGraphs(body: string) {
  return [...body.matchAll(jsonLdScriptBodyPattern)].map((match) =>
    JSON.parse(match[1] ?? "")
  );
}

async function publishedArticleSlug() {
  const body = await fetch(new URL("/sitemap.xml", targetUrl)).then(
    (response) => response.text()
  );
  return body.match(publishedArticleSlugPattern)?.[1] ?? null;
}

test("GET / serves the home page with an absolute canonical URL", async () => {
  const response = await fetch(new URL("/", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/html");
  expect(body).toContain('<html lang="ja">');
  const canonical = body.match(canonicalPattern)?.[1];
  expect(canonical).toBeDefined();
  const canonicalUrl = new URL(canonical ?? "");
  expect(canonicalUrl.hostname).toBe("nyatinte.com");
  expect(canonicalUrl.pathname).toBe("/");
  if (new URL(targetUrl).protocol === "https:") {
    expect(canonicalUrl.href).toBe(new URL("/", targetUrl).href);
  }
});

test("a colocated article OGP is served by the built Worker", async () => {
  const page = await fetch(new URL("/log/cua-computer-use", targetUrl));
  expect(page.status).toBe(200);
  const imageUrl = (await page.text()).match(ogImagePattern)?.[1];
  expect(imageUrl).toBeDefined();
  const image = new URL(imageUrl ?? "");
  expect(image.hostname).toBe("nyatinte.com");
  const response = await fetch(new URL(image.pathname, targetUrl));
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("image/jpeg");
});

test("GET / sends fresh CSP nonces for every inline script", async () => {
  const firstResponse = await fetch(new URL("/", targetUrl));
  const firstBody = await firstResponse.text();
  const secondResponse = await fetch(new URL("/", targetUrl));
  const secondBody = await secondResponse.text();

  expect(firstResponse.status).toBe(200);
  expect(secondResponse.status).toBe(200);
  const firstNonce = nonceFrom(firstResponse);
  const secondNonce = nonceFrom(secondResponse);
  expect(secondNonce).not.toBe(firstNonce);

  for (const [body, nonce] of [
    [firstBody, firstNonce],
    [secondBody, secondNonce],
  ]) {
    const inlineScripts = (body.match(scriptTagPattern) ?? []).filter(
      (tag) => !scriptSrcAttributePattern.test(tag)
    );
    expect(inlineScripts.length).toBeGreaterThan(0);
    for (const tag of inlineScripts) {
      expect(tag.match(scriptNoncePattern)?.[1]).toBe(nonce);
    }
  }
});

test("home preloads self-hosted, immutable Latin fonts", async () => {
  const page = await fetch(new URL("/", targetUrl));
  const fonts = [...(await page.text()).matchAll(latinFontPattern)];
  expect(fonts).toHaveLength(2);
  const responses = await Promise.all(
    fonts.map(([, path]) => fetch(new URL(path, targetUrl)))
  );
  for (const response of responses) {
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("font/woff2");
    expect(response.headers.get("cache-control")).toContain("immutable");
  }
});

test("HTML pages expose markdown alternates and Vary: Accept", async () => {
  const response = await fetch(new URL("/", targetUrl));
  expect(response.status).toBe(200);
  expect(response.headers.get("vary")).toMatch(varyAcceptPattern);
  expectMarkdownAlternatePath(response.headers.get("link"), "/");
});

test("GET / returns markdown when Accept prefers text/markdown", async () => {
  const response = await fetch(new URL("/", targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(response.headers.get("vary")).toMatch(varyAcceptPattern);
  expect(body).toContain("# nyatinte");
});

test("HTML wins when its Accept q-value is higher than text/markdown", async () => {
  const response = await fetch(new URL("/", targetUrl), {
    headers: { Accept: "text/html, text/markdown;q=0.1" },
  });

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/html");
  expect(response.headers.get("vary")).toMatch(varyAcceptPattern);
});

test("HEAD / negotiates markdown and keeps agent-ready headers", async () => {
  const response = await fetch(new URL("/", targetUrl), {
    headers: { Accept: "text/markdown" },
    method: "HEAD",
  });
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(response.headers.get("vary")).toMatch(varyAcceptPattern);
  expect(body).toBe("");
});

test("HEAD / keeps Vary and Link for HTML", async () => {
  const response = await fetch(new URL("/", targetUrl), { method: "HEAD" });

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/html");
  expect(response.headers.get("vary")).toMatch(varyAcceptPattern);
  expectMarkdownAlternatePath(response.headers.get("link"), "/");
});

test("unknown pages return HTTP 404 markdown when requested", async () => {
  const response = await fetch(new URL("/definitely-missing", targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  const body = await response.text();

  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(body).toContain("ページが見つかりません");
});

test("missing article slugs return 404 markdown", async () => {
  const response = await fetch(new URL("/log/not-a-real-slug", targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  const body = await response.text();

  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(body).toContain("記事が見つかりません");
});

test("スクロールする公開ページは先頭へ戻るボタンを隠して描画する", async () => {
  const slug = await publishedArticleSlug();
  expect(slug).toBeTruthy();
  const paths = ["/log", `/log/${slug}`];
  const bodies = await Promise.all(
    paths.map(async (path) => {
      const response = await fetch(new URL(path, targetUrl));
      return [path, await response.text()] as const;
    })
  );
  for (const [path, body] of bodies) {
    const button = body.match(backToTopButtonPattern)?.[0];
    expect(button, path).toBeDefined();
    expect(button, path).toContain("hidden");
  }

  const missing = await fetch(new URL("/definitely-missing", targetUrl));
  expect(missing.status).toBe(404);
  expect(await missing.text()).not.toContain("ページの先頭へ戻る");
});

test("former achievement URLs redirect to the log", async () => {
  const responses = await Promise.all(
    ["/done", "/done/old-record"].map((path) =>
      fetch(new URL(path, targetUrl), { redirect: "manual" })
    )
  );
  for (const response of responses) {
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("/log");
  }
});

test("GET /sitemap.xml lists core URLs", async () => {
  const response = await fetch(new URL("/sitemap.xml", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/xml");
  expect(body).toContain("<urlset");
  expect(body).toContain("/log</loc>");
  expect(body).toContain("/log/template</loc>");
  expect(body).not.toContain("/done</loc>");
  expect(body).toContain("<lastmod>");
});

test("GET /log/rss.xml lists articles", async () => {
  const response = await fetch(new URL("/log/rss.xml", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/rss+xml");
  expect(body).toContain("<rss");
  expect(body).toContain("わからなかったことを調べて書く");
  expect(body).toContain("/log/template");
});

test("the log list keeps pagination hidden while one page is enough", async () => {
  const response = await fetch(new URL("/log", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(body).toContain('role="list"');
  expect(body).not.toContain('aria-label="ページネーション"');
});

test("the first log page canonicalizes to /log", async () => {
  const response = await fetch(new URL("/log?page=1", targetUrl), {
    redirect: "manual",
  });

  expect(response.status).toBe(301);
  expect(response.headers.get("location")).toBe("/log");
});

test("the first log page keeps other query parameters when redirecting", async () => {
  const response = await fetch(new URL("/log?page=1&q=test", targetUrl), {
    redirect: "manual",
  });

  expect(response.status).toBe(301);
  expect(response.headers.get("location")).toBe("/log?q=test");
});

test.each(["0", "-1", "1.5", "abc", "999"])(
  "invalid log page %s returns 404",
  async (page) => {
    const response = await fetch(
      new URL(`/log?page=${encodeURIComponent(page)}`, targetUrl)
    );
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(body).toContain("ページが見つかりません");
  }
);

test("the log list still returns every article as markdown", async () => {
  const response = await fetch(new URL("/log", targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(body).toContain(canonicalSiteUrl("/log/template"));
});

test("robots.txt advertises the sitemap and content signals", async () => {
  const response = await fetch(new URL("/robots.txt", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(body).toContain("Sitemap: https://nyatinte.com/sitemap.xml");
  expect(body).toContain("# LLMs: https://nyatinte.com/llms.txt");
  expect(body).toContain(
    "Content-Signal: search=yes, ai-input=yes, ai-train=no"
  );
  expect(body.indexOf("Content-Signal")).toBeGreaterThan(
    body.indexOf("User-agent")
  );
});

test("GET /llms.txt serves markdown with core page links", async () => {
  const response = await fetch(new URL("/llms.txt", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(body.startsWith(`# ${siteIdentity.name}`)).toBe(true);
  expect(body).toContain(`> ${siteIdentity.description}`);
  expect(body).toContain(`(${canonicalSiteUrl("/")})`);
  expect(body).toContain(`(${canonicalSiteUrl("/log")})`);
  expect(body).toContain(`(${canonicalSiteUrl("/log/template")})`);
  expect(body).toContain(`(${canonicalSiteUrl("/log/rss.xml")})`);
  expect(body).toContain(`(${canonicalSiteUrl("/sitemap.xml")})`);
});

test("Accept: text/markdown still negotiates HTML on / without hitting /llms.txt", async () => {
  const response = await fetch(new URL("/", targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(await response.text()).toContain("# nyatinte");
});

test("home page JSON-LD parses into Person and WebSite graphs", async () => {
  const body = await fetch(new URL("/", targetUrl)).then((response) =>
    response.text()
  );
  const types = jsonLdGraphs(body).map((graph) => graph["@type"]);
  expect(types).toContain("Person");
  expect(types).toContain("WebSite");
});

test("home JSON-LD descriptions match the meta description", async () => {
  const body = await fetch(new URL("/", targetUrl)).then((response) =>
    response.text()
  );
  const metaDescription = body.match(metaDescriptionPattern)?.[1];
  expect(metaDescription).toBe(siteIdentity.description);
  const graphs = jsonLdGraphs(body);
  const person = graphs.find((graph) => graph["@type"] === "Person");
  const website = graphs.find((graph) => graph["@type"] === "WebSite");
  expect(person?.description).toBe(metaDescription);
  expect(website?.description).toBe(metaDescription);
});

test("published article pages expose BlogPosting JSON-LD", async () => {
  const slug = await publishedArticleSlug();
  expect(slug).toBeTruthy();
  const body = await fetch(new URL(`/log/${slug}`, targetUrl)).then(
    (response) => response.text()
  );
  const graphs = jsonLdGraphs(body);
  expect(graphs.some((graph) => graph["@type"] === "BlogPosting")).toBe(true);
  expect(body).toContain("Markdown をコピー");
  expect(body).toContain(`view-transition-name: log-title-${slug}`);
  expect(body).toContain('type="application/rss+xml"');
  expect(body).toContain('href="https://nyatinte.com/log/rss.xml"');
});

test("記事ページに X シェアとリンクコピーを出す", async () => {
  const slug = await publishedArticleSlug();
  expect(slug).toBeTruthy();
  const body = await fetch(new URL(`/log/${slug}`, targetUrl)).then(
    (response) => response.text()
  );
  const href = body.match(xIntentHrefPattern)?.[1];
  expect(href).toBeDefined();

  const shareUrl = new URL((href ?? "").replaceAll("&amp;", "&"));
  expect(shareUrl.searchParams.get("url")).toBe(
    canonicalSiteUrl(`/log/${slug}`)
  );
  const text = shareUrl.searchParams.get("text") ?? "";
  expect(text.length).toBeGreaterThan("| nyatinte.com".length);
  expect(text.endsWith(" | nyatinte.com")).toBe(true);

  expect(body).toContain('rel="noopener noreferrer"');
  expect(body).toContain('target="_blank"');
  expect(body).toContain("X でシェア");
  expect(body).toContain("リンクをコピー");
  expect(body).toContain('aria-label="記事の共有"');
});

test("記事以外のページには共有ボタンを出さない", async () => {
  const bodies = await Promise.all(
    ["/", "/log"].map(async (path) =>
      fetch(new URL(path, targetUrl)).then((response) => response.text())
    )
  );
  for (const body of bodies) {
    expect(body).not.toContain("x.com/intent/post");
    expect(body).not.toContain("リンクをコピー");
  }
});

test("存在しない記事には共有 UI を出さない", async () => {
  const response = await fetch(new URL("/log/not-a-real-slug", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(404);
  expect(body).not.toContain("x.com/intent/post");
  expect(body).not.toContain("リンクをコピー");
});

test("published article pages return markdown when requested", async () => {
  const slug = await publishedArticleSlug();
  expect(slug).toBeTruthy();
  const response = await fetch(new URL(`/log/${slug}`, targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(body.startsWith("# ")).toBe(true);
});

test("markdown responses for svx articles omit svelte blocks but keep html and prose", async () => {
  const cases = [
    {
      html: '<figure class="thought before">',
      prose: "https://x.com/trycua",
      slug: "cua-computer-use",
    },
    {
      html: '<div class="closing-message">',
      prose: "AI をはじめとした技術の進化が",
      slug: "stay-light-in-ai-era",
    },
  ];

  const results = await Promise.all(
    cases.map(async ({ html, prose, slug }) => {
      const response = await fetch(new URL(`/log/${slug}`, targetUrl), {
        headers: { Accept: "text/markdown" },
      });
      return {
        body: await response.text(),
        contentType: response.headers.get("content-type"),
        html,
        prose,
        status: response.status,
      };
    })
  );

  for (const { body, contentType, html, prose, status } of results) {
    expect(status).toBe(200);
    expect(contentType).toContain("text/markdown");
    expect(body.startsWith("# ")).toBe(true);
    expect(body).not.toContain("<style");
    expect(body).not.toContain("<script");
    expect(body).not.toContain("<XPostCard");
    expect(body).toContain(html);
    expect(body).toContain(prose);
  }
});

test("home and the log share a 1200 × 630 OGP image", async () => {
  const home = await fetch(new URL("/", targetUrl));
  const log = await fetch(new URL("/log", targetUrl));
  const homeBody = await home.text();
  const logBody = await log.text();
  const homeImage = homeBody.match(ogImagePattern)?.[1];
  const logImage = logBody.match(ogImagePattern)?.[1];
  expect(logBody).toContain('role="list"');
  expect(logBody).toContain('type="application/rss+xml"');
  expect(logBody).toContain('href="https://nyatinte.com/log/rss.xml"');
  expect(homeImage).toBeDefined();
  expect(logImage).toBe(homeImage);

  const imageUrl = new URL(homeImage ?? "");
  expect(imageUrl.origin).toBe(
    new URL(homeBody.match(canonicalPattern)?.[1] ?? "").origin
  );
  const response = await fetch(new URL(imageUrl.pathname, targetUrl));
  const image = new DataView(await response.arrayBuffer());

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("image/png");
  expect(image.getUint32(0)).toBe(0x89_50_4e_47);
  expect(image.getUint32(16)).toBe(1200);
  expect(image.getUint32(20)).toBe(630);
});

test("公開ページに X のカード用タグが揃っている", async () => {
  const slug = await publishedArticleSlug();
  expect(slug).toBeTruthy();
  const bodies = await Promise.all(
    ["/", "/log", `/log/${slug}`].map(async (path) => {
      const response = await fetch(new URL(path, targetUrl));
      expect(response.status, path).toBe(200);
      return [path, await response.text()] as const;
    })
  );
  for (const [path, body] of bodies) {
    for (const name of [
      "twitter:card",
      "twitter:site",
      "twitter:title",
      "twitter:description",
      "twitter:image",
      "twitter:image:alt",
    ]) {
      expect(body, `${path}: ${name}`).toContain(`name="${name}"`);
    }
    const alt = body.match(twitterImageAltPattern)?.[1];
    expect(alt, `${path}: twitter:image:alt content`).toBeTruthy();
    expect(body.match(ogImageAltPattern)?.[1], `${path}: og:image:alt`).toBe(
      alt
    );
  }
});

test("ホームは独自のタイトルで X のカードと RSS 自動検出を出す", async () => {
  const body = await fetch(new URL("/", targetUrl)).then((response) =>
    response.text()
  );

  expect(body).toContain("<title>nyatinte</title>");
  expect(body).toContain('content="nyatinte.com" property="og:title"');
  expect(body).toContain('content="nyatinte.com" name="twitter:title"');
  expect(body).toContain('property="og:image:alt"');
  expect(body).toContain('name="twitter:image:alt"');
  expect(body).toContain(
    '<link href="https://nyatinte.com/log/rss.xml" rel="alternate" title="ログ" type="application/rss+xml"'
  );
});

test("公開ページは RSS フィードを自動検出用に示す", async () => {
  const slug = await publishedArticleSlug();
  expect(slug).toBeTruthy();
  const bodies = await Promise.all(
    ["/", "/log", `/log/${slug}`].map(async (path) => {
      const response = await fetch(new URL(path, targetUrl));
      return [path, await response.text()] as const;
    })
  );
  for (const [path, body] of bodies) {
    const [link] = body.match(rssAutodiscoveryLinkPattern) ?? [];
    expect(link, path).toBeDefined();
    expect(link, path).toContain('rel="alternate"');
    expect(link, path).toContain('type="application/rss+xml"');
    // 従来の page-meta と同じ title を保つ。
    expect(link, path).toContain('title="ログ"');
    // 重複して出力しない。
    expect(body.match(/rel="alternate"/gu), path).toHaveLength(1);
  }
});

test("404 の HTML には RSS の自動検出 link を出さない", async () => {
  const bodies = await Promise.all(
    ["/definitely-missing", "/log/not-a-real-slug"].map(async (path) => {
      const response = await fetch(new URL(path, targetUrl), {
        headers: { Accept: "text/html" },
      });
      return [path, response, await response.text()] as const;
    })
  );
  for (const [path, response, body] of bodies) {
    expect(response.status, path).toBe(404);
    expect(response.headers.get("content-type"), path).toContain("text/html");
    expect(body, path).not.toMatch(rssAutodiscoveryLinkPattern);
    expect(body, path).not.toContain('type="application/rss+xml"');
  }
});

test("ログのページに目に見える RSS リンクがある", async () => {
  const slug = await publishedArticleSlug();
  expect(slug).toBeTruthy();
  const bodies = await Promise.all(
    ["/log", `/log/${slug}`].map(async (path) => {
      const response = await fetch(new URL(path, targetUrl));
      return [path, await response.text()] as const;
    })
  );
  for (const [path, body] of bodies) {
    expect(body, path).toContain('href="/log/rss.xml"');
    expect(body, path).toContain("RSS で購読");
  }
});

test("GET /log/rss.xml は購読に必要な要素を返す", async () => {
  const body = await fetch(new URL("/log/rss.xml", targetUrl)).then(
    (response) => response.text()
  );

  expect(body).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
  expect(body).toContain(
    '<atom:link href="https://nyatinte.com/log/rss.xml" rel="self" type="application/rss+xml" />'
  );
  expect(body).toContain("<language>ja</language>");
  expect(body).toContain("<lastBuildDate>");
  expect(body).toContain('<guid isPermaLink="true">');
});

test("HEAD /log/rss.xml はヘッダーだけを返す", async () => {
  const response = await fetch(new URL("/log/rss.xml", targetUrl), {
    method: "HEAD",
  });

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/rss+xml");
  expect(await response.text()).toBe("");
});

const logArticleSlugs = [
  "cua-computer-use",
  "stay-light-in-ai-era",
  "template",
];

test("built Worker serves the ZBSearch binary index", async () => {
  const response = await fetch(new URL("/zbsearch/index.zbsb", targetUrl));
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain(
    "application/octet-stream"
  );
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000);
});

test("GET /log renders the search UI and the no-JS article list", async () => {
  const response = await fetch(new URL("/log", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(body).toContain('name="q"');
  expect(body).toContain('id="log-search-input"');
  expect(body).toContain('role="status"');
  for (const slug of logArticleSlugs) {
    expect(body).toContain(`/log/${slug}`);
  }
});

test("GET /log?q=Cua reflects the query, hides the article list, and keeps the canonical URL", async () => {
  const body = await fetch(new URL("/log?q=Cua", targetUrl)).then((response) =>
    response.text()
  );

  expect(body).toContain('value="Cua"');
  expect(body.match(canonicalPattern)?.[1]).toBe("https://nyatinte.com/log");
  for (const slug of logArticleSlugs) {
    expect(body).not.toContain(`/log/${slug}`);
  }
});

test("GET /log with no matching query hides the article list and keeps the canonical URL", async () => {
  const response = await fetch(
    new URL(`/log?q=${encodeURIComponent("存在しない語")}`, targetUrl)
  );
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(body.match(canonicalPattern)?.[1]).toBe("https://nyatinte.com/log");
  for (const slug of logArticleSlugs) {
    expect(body).not.toContain(`/log/${slug}`);
  }
});
