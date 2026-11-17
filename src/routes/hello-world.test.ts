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
const markdownAlternateHrefPattern =
  /<([^>]+)>;\s*rel="alternate";\s*type="text\/markdown"/;

function expectMarkdownAlternatePath(link: string | null, pathname: string) {
  expect(link).toContain('rel="alternate"');
  expect(link).toContain('type="text/markdown"');
  const href = link?.match(markdownAlternateHrefPattern)?.[1];
  expect(href).toBeDefined();
  const parsed = new URL(href ?? "");
  const expectedPath = pathname === "/" ? "/" : pathname;
  expect(parsed.pathname).toBe(expectedPath);
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

test("トップページの場合にcanonical URL は絶対 URL になる", async () => {
  // Given: トップページ
  // When: GET / を開くと
  const response = await fetch(new URL("/", targetUrl));
  const body = await response.text();

  // Then
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

test("Worker が記事に置いた OGP 画像を配信する", async () => {
  // Given: OGP 画像を持つ公開記事
  // When: 記事ページを取得する
  const page = await fetch(new URL("/log/cua-computer-use", targetUrl));
  const body = await page.text();
  const imageUrl = body.match(ogImagePattern)?.[1];
  // Then: 記事ページが成功し OGP 画像 URL を含む
  expect(page.status).toBe(200);
  expect(imageUrl).toBeDefined();

  // When: OGP 画像を取得する
  const image = new URL(imageUrl ?? "");
  const response = await fetch(new URL(image.pathname, targetUrl));
  // Then: Worker から JPEG を配信する
  expect(image.hostname).toBe("nyatinte.com");
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("image/jpeg");
});

test("インラインスクリプトの CSP nonce をリクエストごとに新しくする", async () => {
  // Given: トップページを 2 回取得する
  // When: GET / を繰り返す
  const firstResponse = await fetch(new URL("/", targetUrl));
  const firstBody = await firstResponse.text();
  const secondResponse = await fetch(new URL("/", targetUrl));
  const secondBody = await secondResponse.text();

  // Then
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

test("トップページの場合に自前配信の不変な Latin フォントを preload する", async () => {
  // Given: トップページ
  // When: HTML を返すと
  const page = await fetch(new URL("/", targetUrl));
  const fonts = [...(await page.text()).matchAll(latinFontPattern)];
  // Then
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

test("HTML ページの場合にMarkdown alternate と Vary: Accept を含む", async () => {
  // Given: HTML ページ
  // When: レスポンスを返すと
  const response = await fetch(new URL("/", targetUrl));
  // Then
  expect(response.status).toBe(200);
  expect(response.headers.get("vary")).toMatch(varyAcceptPattern);
  expectMarkdownAlternatePath(response.headers.get("link"), "/");
});

test("Accept が text/markdown を優先するとき、Markdown を返す", async () => {
  // Given: Accept が text/markdown を優先するとき
  // When: GET / を呼ぶと
  const response = await fetch(new URL("/", targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  const body = await response.text();

  // Then
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(response.headers.get("vary")).toMatch(varyAcceptPattern);
  expect(body).toContain("# nyatinte");
});

test("HTML の Accept q 値が text/markdown より高いとき、HTML を返す", async () => {
  // Given: HTML の Accept q 値が text/markdown より高いとき
  // When: GET / を呼ぶと
  const response = await fetch(new URL("/", targetUrl), {
    headers: { Accept: "text/html, text/markdown;q=0.1" },
  });

  // Then
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/html");
  expect(response.headers.get("vary")).toMatch(varyAcceptPattern);
});

test("Accept が Markdown を優先するとき、Markdown のヘッダーを保ち本文は返さない", async () => {
  // Given: Accept が Markdown を優先するとき
  // When: HEAD / を呼ぶと
  const response = await fetch(new URL("/", targetUrl), {
    headers: { Accept: "text/markdown" },
    method: "HEAD",
  });
  const body = await response.text();

  // Then
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(response.headers.get("vary")).toMatch(varyAcceptPattern);
  expect(body).toBe("");
});

test("HTML を要求するとき、Vary と Link ヘッダーを保つ", async () => {
  // Given: HTML を要求するとき
  // When: HEAD / を呼ぶと
  const response = await fetch(new URL("/", targetUrl), { method: "HEAD" });

  // Then
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/html");
  expect(response.headers.get("vary")).toMatch(varyAcceptPattern);
  expectMarkdownAlternatePath(response.headers.get("link"), "/");
});

test("存在しないページの場合に404 の Markdown を返す", async () => {
  // Given: 存在しないページ
  // When: Markdown を要求すると
  const response = await fetch(new URL("/definitely-missing", targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  const body = await response.text();

  // Then
  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(body).toContain("ページが見つかりません");
});

test("存在しない記事スラッグの場合に404 の Markdown を返す", async () => {
  // Given: 存在しない記事スラッグ
  // When: Markdown を要求すると
  const response = await fetch(new URL("/log/not-a-real-slug", targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  const body = await response.text();

  // Then
  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(body).toContain("記事が見つかりません");
});

test("旧実績 URLの場合に/log へリダイレクトする", async () => {
  // Given: 旧実績 URL
  // When: アクセスすると
  const responses = await Promise.all(
    ["/done", "/done/old-record"].map((path) =>
      fetch(new URL(path, targetUrl), { redirect: "manual" })
    )
  );
  for (const response of responses) {
    // Then
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("/log");
  }
});

test("サイトマップの場合に主要 URL を列挙する", async () => {
  // Given: サイトマップ
  // When: GET /sitemap.xml を呼ぶと
  const response = await fetch(new URL("/sitemap.xml", targetUrl));
  const body = await response.text();

  // Then
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/xml");
  expect(body).toContain("<urlset");
  expect(body).toContain("/log</loc>");
  expect(body).toContain("/log/template</loc>");
  expect(body).not.toContain("/done</loc>");
  expect(body).toContain("<lastmod>");
});

test("RSS フィードの場合に記事を列挙する", async () => {
  // Given: RSS フィード
  // When: GET /log/rss.xml を呼ぶと
  const response = await fetch(new URL("/log/rss.xml", targetUrl));
  const body = await response.text();

  // Then
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/rss+xml");
  expect(body).toContain("<rss");
  expect(body).toContain("わからなかったことを調べて書く");
  expect(body).toContain("/log/template");
});

test("robots.txtの場合にsitemap と content signals を案内する", async () => {
  // Given: robots.txt
  // When: 取得すると
  const response = await fetch(new URL("/robots.txt", targetUrl));
  const body = await response.text();

  // Then
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

test("llms.txtの場合に主要ページへのリンクを含む Markdown を返す", async () => {
  // Given: llms.txt
  // When: GET /llms.txt を呼ぶと
  const response = await fetch(new URL("/llms.txt", targetUrl));
  const body = await response.text();

  // Then
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

test("/ で Accept: text/markdown を送るとき、/llms.txt ではなくトップページの Markdown を返す", async () => {
  // Given: / で Accept: text/markdown を送るとき
  // When: コンテンツを要求すると
  const response = await fetch(new URL("/", targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  // Then
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(await response.text()).toContain("# nyatinte");
});

test("トップページの場合にPerson と WebSite の graph を含む", async () => {
  // Given: トップページ
  // When: JSON-LD を解析すると
  const body = await fetch(new URL("/", targetUrl)).then((response) =>
    response.text()
  );
  const types = jsonLdGraphs(body).map((graph) => graph["@type"]);
  // Then
  expect(types).toContain("Person");
  expect(types).toContain("WebSite");
});

test("トップページの JSON-LDの場合にmeta description と一致する", async () => {
  // Given: トップページの JSON-LD
  // When: 説明文を確認すると
  const body = await fetch(new URL("/", targetUrl)).then((response) =>
    response.text()
  );
  const metaDescription = body.match(metaDescriptionPattern)?.[1];
  // Then
  expect(metaDescription).toBe(siteIdentity.description);
  const graphs = jsonLdGraphs(body);
  const person = graphs.find((graph) => graph["@type"] === "Person");
  const website = graphs.find((graph) => graph["@type"] === "WebSite");
  expect(person?.description).toBe(metaDescription);
  expect(website?.description).toBe(metaDescription);
});

test("公開記事ページの場合にBlogPosting を含む", async () => {
  // Given: 公開記事ページ
  // When: JSON-LD を確認すると
  const slug = await publishedArticleSlug();
  // Then
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

test("公開記事ページの場合に記事の Markdown を返す", async () => {
  // Given: 公開記事ページ
  // When: Markdown を要求すると
  const slug = await publishedArticleSlug();
  // Then
  expect(slug).toBeTruthy();
  const response = await fetch(new URL(`/log/${slug}`, targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(body.startsWith("# ")).toBe(true);
});

test("トップページとログ一覧で1200 × 630 の共通 OGP 画像を使う", async () => {
  // Given: トップページとログ一覧
  // When: OGP 画像を確認すると
  const home = await fetch(new URL("/", targetUrl));
  const log = await fetch(new URL("/log", targetUrl));
  const homeBody = await home.text();
  const logBody = await log.text();
  const homeImage = homeBody.match(ogImagePattern)?.[1];
  const logImage = logBody.match(ogImagePattern)?.[1];
  // Then
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

test("公開ページに X のカード用メタタグを含める", async () => {
  // Given: トップページとログ一覧
  const paths = ["/", "/log"];
  // When: 両方のページを取得する
  const bodies = await Promise.all(
    paths.map(async (path) => {
      const response = await fetch(new URL(path, targetUrl));
      return [path, await response.text()] as const;
    })
  );
  // Then: 両方のページに X のカード用メタタグを含める
  for (const [path, body] of bodies) {
    for (const name of [
      "twitter:card",
      "twitter:site",
      "twitter:title",
      "twitter:description",
      "twitter:image",
    ]) {
      expect(body, `${path}: ${name}`).toContain(`name="${name}"`);
    }
  }
});
