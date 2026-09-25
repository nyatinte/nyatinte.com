import { ImageResponse } from "takumi-js/response";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const READY_PATH = "/";
const READY_BODY = "Takumi Workers PoC";
const POC_PATH = "/__poc/takumi";
const IMAGE_HTML = `
<div lang="en" style="width: 1200px; height: 630px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0a0b0d; color: #e8ebee; font-family: sans-serif;">
  <div style="font-size: 72px; font-weight: 700;">Takumi WASM</div>
  <div style="margin-top: 24px; font-size: 32px; color: #8a939c;">Cloudflare Workers PoC</div>
</div>`;

function textResponse(
  body: string,
  status: number,
  headers: Record<string, string> = {}
) {
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      ...headers,
    },
    status,
  });
}

function logRenderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ event: "takumi_render_failed", message }));
}

export default {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === READY_PATH) {
      return textResponse(READY_BODY, 404);
    }

    if (pathname !== POC_PATH) {
      return textResponse("Not Found", 404);
    }

    if (request.method !== "GET") {
      return textResponse("Method Not Allowed", 405, { allow: "GET" });
    }

    const response = new ImageResponse(IMAGE_HTML, {
      headers: { "cache-control": "no-store" },
      height: IMAGE_HEIGHT,
      onError: logRenderError,
      width: IMAGE_WIDTH,
    });

    try {
      await response.ready;
      return response;
    } catch {
      return textResponse("Image generation failed", 500);
    }
  },
};
