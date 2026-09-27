import { jaModel, Parser } from "budoux";
import { ImageResponse } from "takumi-js/response";
import wasmModule, { init as initializeTakumi, Renderer } from "takumi-js/wasm";
import achievementSnapshot from "../achievements.snapshot.json";
import mplus1pBold from "../fonts/MPLUS1p-700-jis1.woff2";
import { createImageHtml, OGP_FONT_FAMILY } from "./card";
import {
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
const parser = new Parser(jaModel);

type AchievementFixture = (typeof achievementSnapshot.records)[number];
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
      name: OGP_FONT_FAMILY,
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
            fontFamily: `'${OGP_FONT_FAMILY}'`,
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

function selectFixture(value: string | null): AchievementFixture | undefined {
  return achievementSnapshot.records.find(
    ({ sample }) => sample === (value ?? "long")
  );
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
      const image = new ImageResponse(
        createImageHtml(title, summary, {
          occurredAt: fixture.occurredAt,
          tags,
        }),
        {
          headers: { "cache-control": "no-store" },
          height: IMAGE_HEIGHT,
          lang: "ja",
          onError: logRenderError,
          renderer,
          width: IMAGE_WIDTH,
        }
      );
      await image.ready;
      return image;
    } catch (error) {
      logRenderError(error);
      return textResponse("Image generation failed", 500);
    }
  },
};
