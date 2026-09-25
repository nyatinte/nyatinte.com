import { ImageResponse } from "takumi-js/response";
import mplus1pBold from "../fonts/MPLUS1p-700-fixture.woff2";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const READY_PATH = "/";
const READY_BODY = "Takumi Workers PoC";
const POC_PATH = "/__poc/takumi";
const IMAGE_HTML = `
<div lang="ja" style="position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 1200px; height: 630px; padding: 58px 68px 54px 88px; background: linear-gradient(135deg, #11151d, #1a2230); color: #f5f3ed; font-family: 'M PLUS 1p'; font-weight: 700;">
  <div style="position: absolute; top: 48px; bottom: 48px; left: 36px; width: 5px; border-radius: 3px; background: #ffbe70;"></div>
  <div style="display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 14px;">
      <div style="width: 13px; height: 13px; border-radius: 50%; background: #ffbe70;"></div>
      <div style="font-size: 27px; line-height: 1;"><span>nyatinte.com</span><span style="margin-left: 9px; color: #929bad;">/done</span></div>
    </div>
    <div style="color: #aeb6c5; font-size: 20px;">2026/09/26</div>
  </div>
  <div style="display: flex; flex: 1; flex-direction: column; justify-content: center; padding-top: 22px;">
    <div style="font-size: 68px; line-height: 1.24; letter-spacing: 0.01em;">日本語の実績カードを<br />描画した</div>
    <div style="margin-top: 25px; color: #b5bdcb; font-size: 26px; line-height: 1.5;">固定データから Takumi で PNG を生成。</div>
  </div>
  <div style="display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 11px;">
      <div style="padding: 8px 15px; border: 1px solid #465166; border-radius: 20px; background: #202735; color: #d9dfeb; font-size: 17px; line-height: 1.2;">Workers</div>
      <div style="padding: 8px 15px; border: 1px solid #465166; border-radius: 20px; background: #202735; color: #d9dfeb; font-size: 17px; line-height: 1.2;">OGP</div>
      <div style="padding: 8px 15px; border: 1px solid #465166; border-radius: 20px; background: #202735; color: #d9dfeb; font-size: 17px; line-height: 1.2;">日本語</div>
    </div>
    <div style="display: flex; align-items: center; gap: 11px; color: #d4dae4; font-size: 20px;">
      <div style="display: flex; width: 36px; height: 36px; align-items: center; justify-content: center; border: 1px solid #68758b; border-radius: 12px; color: #ffbe70; font-size: 15px;">ny</div>
      <span>@nyatinte</span>
    </div>
  </div>
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
      fontFamilies: ["M PLUS 1p"],
      fonts: [{ data: mplus1pBold, name: "M PLUS 1p", weight: 700 }],
      headers: { "cache-control": "no-store" },
      height: IMAGE_HEIGHT,
      lang: "ja",
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
