import { jaModel, Parser } from "budoux";
import { ImageResponse } from "takumi-js/response";
import wasmModule, { init as initializeTakumi, Renderer } from "takumi-js/wasm";
import mplus1pBold from "../fonts/MPLUS1p-700-jis1.woff2";
import {
  layoutTags,
  layoutText,
  MAX_SUMMARY_LINES,
  MAX_TITLE_LINES,
  measurementInputs,
  normalizeSupportedText,
  SUMMARY_FONT_SIZE,
  TITLE_FONT_SIZES,
} from "./layout";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const READY_PATH = "/";
const READY_BODY = "Takumi Workers PoC";
const POC_PATH = "/__poc/takumi";
const TITLE_WIDTH = 1040;
const SUMMARY_WIDTH = 1040;
const FONT_FAMILY = "M PLUS 1p";
const parser = new Parser(jaModel);

const FIXTURES = {
  brackets: {
    summary: "開き括弧と閉じ括弧が行の端に残らないよう調整。",
    tags: ["日本語", "組版", "テスト", "BudouX"],
    title: "「日本語カード」の禁則処理を確かめる",
  },
  fallback: {
    summary: "第1水準外の文字と絵文字は、白い四角に置き換えて描画する。",
    tags: ["フォント", "代替", "M PLUS"],
    title: "絵文字 😀 とJIS第2水準外の𠮷を代替記号に置き換える",
  },
  long: {
    summary:
      "JIS第1水準の漢字を含むM PLUS 1pを使い、BudouXの文節とTakumiの実測幅で3行以内へ組版する。",
    tags: [
      "これは極端に長い日本語のタグ名です",
      "abcdefghijklmnop",
      "日本語",
      "組版",
      "計測",
    ],
    title:
      "Workers の日本語実績カードで、可変長タイトルとフォント計測を検証した",
  },
  short: {
    summary: "積読を一冊読み終え、記録を残した。",
    tags: ["読書", "記録"],
    title: "読書記録を公開した",
  },
} as const;

type FixtureName = keyof typeof FIXTURES;
type TakumiRenderer = InstanceType<typeof Renderer>;

let rendererPromise: Promise<TakumiRenderer> | undefined;

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

function getRenderer(): Promise<TakumiRenderer> {
  rendererPromise ??= (async () => {
    await initializeTakumi({ module_or_path: wasmModule });
    const renderer = new Renderer();
    await renderer.registerFont({
      data: mplus1pBold,
      name: FONT_FAMILY,
      weight: 700,
    });
    return renderer;
  })();
  return rendererPromise;
}

async function getMeasurements(
  renderer: TakumiRenderer,
  segments: readonly string[]
): Promise<Map<number, Map<string, number>>> {
  const measurements = new Map<number, Map<string, number>>();
  const texts = measurementInputs(segments);
  const fontSizes = [...new Set([...TITLE_FONT_SIZES, SUMMARY_FONT_SIZE])];

  for (const fontSize of fontSizes) {
    const widths = new Map<string, number>();
    for (const text of texts) {
      // biome-ignore lint/performance/noAwaitInLoops: a shared WASM Renderer is measured sequentially.
      const measured = await renderer.measure(
        {
          lang: "ja",
          style: {
            fontFamily: `'${FONT_FAMILY}'`,
            fontSize,
            fontWeight: 700,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          },
          text,
          type: "text",
        },
        { lang: "ja" }
      );
      widths.set(text, measured.width);
    }
    measurements.set(fontSize, widths);
  }

  return measurements;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function linesHtml(lines: readonly string[]): string {
  return lines
    .map(
      (line) => `<div style="white-space: nowrap;">${escapeHtml(line)}</div>`
    )
    .join("");
}

function createImageHtml(
  title: ReturnType<typeof layoutText>,
  summary: ReturnType<typeof layoutText>,
  tags: readonly string[]
): string {
  const tagHtml = layoutTags(tags).map(
    (tag) =>
      `<div style="box-sizing: border-box; max-width: 184px; overflow: hidden; padding: 8px 15px; border: 1px solid #465166; border-radius: 20px; background: #202735; color: #d9dfeb; font-size: 17px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(tag)}</div>`
  );

  return `
<div lang="ja" style="position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 1200px; height: 630px; padding: 58px 68px 54px 88px; background: linear-gradient(135deg, #11151d, #1a2230); color: #f5f3ed; font-family: '${FONT_FAMILY}'; font-weight: 700;">
  <div style="position: absolute; top: 48px; bottom: 48px; left: 36px; width: 5px; border-radius: 3px; background: #ffbe70;"></div>
  <div style="display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 14px;">
      <div style="width: 13px; height: 13px; border-radius: 50%; background: #ffbe70;"></div>
      <div style="font-size: 27px; line-height: 1;"><span>nyatinte.com</span><span style="margin-left: 9px; color: #929bad;">/done</span></div>
    </div>
    <div style="color: #aeb6c5; font-size: 20px;">2026/09/26</div>
  </div>
  <div style="display: flex; flex: 1; flex-direction: column; justify-content: center; padding-top: 22px;">
    <div style="font-size: ${title.fontSize}px; line-height: 1.24; letter-spacing: 0.01em;">${linesHtml(title.lines)}</div>
    <div style="margin-top: 25px; color: #b5bdcb; font-size: ${summary.fontSize}px; line-height: 1.5;">${linesHtml(summary.lines)}</div>
  </div>
  <div style="display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 11px; max-width: 580px; min-width: 0; overflow: hidden;">${tagHtml.join("")}</div>
    <div style="display: flex; align-items: center; gap: 11px; color: #d4dae4; font-size: 20px;">
      <div style="display: flex; width: 36px; height: 36px; align-items: center; justify-content: center; border: 1px solid #68758b; border-radius: 12px; color: #ffbe70; font-size: 15px;">ny</div>
      <span>@nyatinte</span>
    </div>
  </div>
</div>`;
}

function selectFixture(
  value: string | null
): (typeof FIXTURES)[FixtureName] | undefined {
  if (value === null) {
    return FIXTURES.long;
  }
  if (Object.hasOwn(FIXTURES, value)) {
    return FIXTURES[value as FixtureName];
  }
  return undefined;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === READY_PATH) {
      return textResponse(READY_BODY, 404);
    }

    if (url.pathname !== POC_PATH) {
      return textResponse("Not Found", 404);
    }

    if (request.method !== "GET") {
      return textResponse("Method Not Allowed", 405, { allow: "GET" });
    }

    const fixture = selectFixture(url.searchParams.get("sample"));
    if (!fixture) {
      return textResponse("Not Found", 404);
    }

    try {
      const renderer = await getRenderer();
      const titleText = normalizeSupportedText(fixture.title);
      const summaryText = normalizeSupportedText(fixture.summary);
      const titleSegments = parser.parse(titleText);
      const summarySegments = parser.parse(summaryText);
      const measurements = await getMeasurements(renderer, [
        ...titleSegments,
        ...summarySegments,
      ]);
      const title = layoutText(titleSegments, {
        fontSizes: TITLE_FONT_SIZES,
        maxLines: MAX_TITLE_LINES,
        maxWidth: TITLE_WIDTH,
        measurements,
      });
      const summary = layoutText(summarySegments, {
        fontSizes: [SUMMARY_FONT_SIZE],
        maxLines: MAX_SUMMARY_LINES,
        maxWidth: SUMMARY_WIDTH,
        measurements,
      });
      const tags = fixture.tags.map(normalizeSupportedText);
      const image = new ImageResponse(createImageHtml(title, summary, tags), {
        headers: { "cache-control": "no-store" },
        height: IMAGE_HEIGHT,
        lang: "ja",
        onError: logRenderError,
        renderer,
        width: IMAGE_WIDTH,
      });
      await image.ready;
      return image;
    } catch (error) {
      logRenderError(error);
      return textResponse("Image generation failed", 500);
    }
  },
};
