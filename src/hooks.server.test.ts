import type { RequestEvent } from "@sveltejs/kit";
import { expect, test } from "vite-plus/test";
import { handle } from "./hooks.server";

function eventFor(url: string): RequestEvent {
  const request = new Request(url, { headers: { Accept: "text/html" } });
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

test("HTML レスポンスの場合に本番 origin を使う", async () => {
  // Given: HTML レスポンス
  // When: markdown Link ヘッダーを返すと
  const response = await handle({
    event: eventFor("http://127.0.0.1:8787/"),
    resolve: async () =>
      new Response("<html></html>", {
        headers: { "content-type": "text/html; charset=utf-8" },
        status: 200,
      }),
  });

  // Then
  expect(response.headers.get("link")).toContain("https://nyatinte.com/");
});

test("旧実績パスの場合にリダイレクトする", async () => {
  // Given: 旧実績パス
  // When: レンダリング前に処理すると
  const response = await handle({
    event: eventFor("http://127.0.0.1:8787/done/old"),
    resolve: () => {
      throw new Error("resolve should not run");
    },
  });

  // Then
  expect(response.status).toBe(301);
  expect(response.headers.get("location")).toBe("/log");
});
