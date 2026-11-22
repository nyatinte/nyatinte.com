import type { RequestEvent } from "@sveltejs/kit";
import { expect, test } from "vite-plus/test";
import { handle } from "./hooks.server";

function eventFor(url: string, accept = "text/html"): RequestEvent {
  const request = new Request(url, { headers: { Accept: accept } });
  return {
    cookies: {
      delete: () => undefined,
      get: () => undefined,
      getAll: () => [],
      parse: () => undefined,
      serialize: () => "",
      set: () => undefined,
    },
    fetch: globalThis.fetch,
    getClientAddress: () => "127.0.0.1",
    isDataRequest: false,
    isRemoteRequest: false,
    isSubRequest: false,
    locals: {},
    params: {},
    platform: { env: {} },
    request,
    route: { id: "/" as const },
    setHeaders: () => undefined,
    tracing: {},
    url: new URL(request.url),
  } as unknown as RequestEvent;
}

test("HTML responses use the production origin in the markdown Link header", async () => {
  const response = await handle({
    event: eventFor("http://127.0.0.1:8787/"),
    resolve: async () =>
      new Response("<html></html>", {
        headers: { "content-type": "text/html; charset=utf-8" },
        status: 200,
      }),
  });

  expect(response.headers.get("link")).toContain("https://nyatinte.com/");
});

test("agent markdown for cua-computer-use drops svelte blocks but keeps html and prose", async () => {
  const response = await handle({
    event: eventFor(
      "http://127.0.0.1:8787/log/cua-computer-use",
      "text/markdown"
    ),
    resolve: () => {
      throw new Error("resolve should not run");
    },
  });
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(body.startsWith("# ")).toBe(true);
  expect(body).not.toContain("<style");
  expect(body).not.toContain("</style>");
  expect(body).not.toContain("<script");
  expect(body).not.toContain("</script>");
  expect(body).not.toContain("<XPostCard");
  expect(body).toContain('<figure class="thought before">');
  expect(body).toContain("https://x.com/trycua");
  expect(body).not.toContain("\n\n\n");
});

test("agent markdown for stay-light-in-ai-era drops svelte blocks but keeps html and prose", async () => {
  const response = await handle({
    event: eventFor(
      "http://127.0.0.1:8787/log/stay-light-in-ai-era",
      "text/markdown"
    ),
    resolve: () => {
      throw new Error("resolve should not run");
    },
  });
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/markdown");
  expect(body.startsWith("# ")).toBe(true);
  expect(body).not.toContain("<style");
  expect(body).not.toContain("</style>");
  expect(body).not.toContain("<script");
  expect(body).not.toContain("</script>");
  expect(body).not.toContain("<XPostCard");
  expect(body).toContain('<div class="closing-message">');
  expect(body).toContain("AI をはじめとした技術の進化が");
  expect(body).not.toContain("\n\n\n");
});

test("HTML content-length matches the body after JSON-LD nonce injection", async () => {
  const html =
    '<html><head><script type="application/ld+json">{"@type":"Thing"}</script></head><body>日本語</body></html>';
  const response = await handle({
    event: eventFor("http://127.0.0.1:8787/"),
    resolve: async () =>
      new Response(html, {
        headers: {
          "content-length": String(new TextEncoder().encode(html).byteLength),
          "content-security-policy": "script-src 'self' 'nonce-abc';",
          "content-type": "text/html; charset=utf-8",
        },
        status: 200,
      }),
  });

  const body = await response.text();
  expect(body).toContain('<script type="application/ld+json" nonce="abc">');
  expect(response.headers.get("content-length")).toBe(
    String(new TextEncoder().encode(body).byteLength)
  );
});

test("redirects former achievement paths before rendering", async () => {
  const response = await handle({
    event: eventFor("http://127.0.0.1:8787/done/old"),
    resolve: () => {
      throw new Error("resolve should not run");
    },
  });

  expect(response.status).toBe(301);
  expect(response.headers.get("location")).toBe("/log");
});
