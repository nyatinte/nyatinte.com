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
