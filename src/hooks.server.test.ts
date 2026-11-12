import type { RequestEvent } from "@sveltejs/kit";
import { expect, test } from "vite-plus/test";
import { handle } from "./hooks.server";

test("HTML responses use the production origin in the markdown Link header", async () => {
  const request = new Request("http://127.0.0.1:8787/", {
    headers: { Accept: "text/html" },
  });
  const event = {
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

  const response = await handle({
    event,
    resolve: async () =>
      new Response("<html></html>", {
        headers: { "content-type": "text/html; charset=utf-8" },
        status: 200,
      }),
  });

  expect(response.headers.get("link")).toContain("https://nyatinte.com/");
});
