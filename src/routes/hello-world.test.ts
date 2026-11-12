import { expect, test } from "vite-plus/test";

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
  const link = response.headers.get("link");
  expect(link).toContain('rel="alternate"');
  expect(link).toContain('type="text/markdown"');
  expect(link).toContain(`${new URL("/", targetUrl).origin}/`);
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

test("unknown pages return HTTP 404 markdown when requested", async () => {
  const response = await fetch(new URL("/definitely-missing", targetUrl), {
    headers: { Accept: "text/markdown" },
  });
  const body = await response.text();

  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(body).toContain("ページが見つかりません");
});

test("GET /sitemap.xml lists core URLs", async () => {
  const response = await fetch(new URL("/sitemap.xml", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/xml");
  expect(body).toContain("<urlset");
  expect(body).toContain("/done</loc>");
});

test("robots.txt advertises the sitemap and content signals", async () => {
  const response = await fetch(new URL("/robots.txt", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(body).toContain("Sitemap: https://nyatinte.com/sitemap.xml");
  expect(body).toContain(
    "Content-Signal: search=yes, ai-input=yes, ai-train=no"
  );
});

test("home and achievements share a 1200 × 630 OGP image", async () => {
  const home = await fetch(new URL("/", targetUrl));
  const done = await fetch(new URL("/done", targetUrl));
  const homeBody = await home.text();
  const homeImage = homeBody.match(ogImagePattern)?.[1];
  const doneImage = (await done.text()).match(ogImagePattern)?.[1];
  expect(homeImage).toBeDefined();
  expect(doneImage).toBe(homeImage);

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
