import { expect, test } from "vite-plus/test";

const targetUrl =
  import.meta.env.VITE_HELLO_WORLD_URL ?? "http://127.0.0.1:8787";
const canonicalPattern = /<link href="([^"]+)" rel="canonical"/;
const cspNoncePattern = /script-src[^;]*'nonce-([^']+)'/;

test("GET / returns the personal home page", async () => {
  const response = await fetch(new URL("/", targetUrl));
  const body = await response.text();

  expect(response.status).toBe(200);
  const csp = response.headers.get("content-security-policy");
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  const nonce = csp?.match(cspNoncePattern)?.[1];
  expect(nonce).toBeTruthy();
  expect(body).toContain(`<script nonce="${nonce}">`);
  expect(body).toContain("Hello");
  expect(body).toContain("I'm nyatinte");
  expect(body).toContain("nyatinte.com");
  expect(body).toContain("ライト・ダークを切り替え");
  expect(body).toContain("親ペンギン");
  expect(body).toContain("子ペンギン");
  expect(body).toContain("/images/adult-penguin.png");
  expect(body).toContain("/images/chick-penguin.png");
  expect(body).toContain("@nyatinte");
  expect(body).toContain('href="/"');
  expect(body).toContain('href="https://github.com/nyatinte"');
  expect(body).toContain('href="https://x.com/nyatinte"');
  expect(body).toContain("実績");
  const canonical = body.match(canonicalPattern);
  expect(canonical).not.toBeNull();
  const canonicalUrl = new URL(canonical?.[1] ?? "");
  expect(canonicalUrl.pathname).toBe("/");
  expect(body).toContain(
    `content="${new URL("/og/home.png", canonicalUrl).href}" property="og:image"`
  );
  if (new URL(targetUrl).protocol === "https:") {
    expect(canonicalUrl.href).toBe(new URL("/", targetUrl).href);
  }
  expect(body).toContain('content="summary_large_image" name="twitter:card"');
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
