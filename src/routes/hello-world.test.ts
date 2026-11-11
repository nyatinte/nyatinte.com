import { expect, test } from "vite-plus/test";

const targetUrl =
  import.meta.env.VITE_HELLO_WORLD_URL ?? "http://127.0.0.1:8787";
const canonicalPattern = /<link href="([^"]+)" rel="canonical"/;
const cspScriptSourcePattern = /(?:^|;)\s*script-src\s+([^;]+)/;
const cspNoncePattern = /'nonce-([^']+)'/;
const scriptTagPattern = /<script\b[^>]*>/gu;
const scriptSrcAttributePattern = /\ssrc\s*=/u;
const scriptNoncePattern = /\snonce="([^"]+)"/u;

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

test("GET /og/home.png returns a 1200 × 630 PNG", async () => {
  const response = await fetch(new URL("/og/home.png", targetUrl));
  const image = new DataView(await response.arrayBuffer());

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("image/png");
  expect(image.getUint32(0)).toBe(0x89_50_4e_47);
  expect(image.getUint32(16)).toBe(1200);
  expect(image.getUint32(20)).toBe(630);
});
