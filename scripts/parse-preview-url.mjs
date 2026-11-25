import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const newlinePattern = /\r?\n/;

export function parsePreviewUrl(jsonl) {
  let url;
  for (const line of jsonl.split(newlinePattern)) {
    try {
      const entry = JSON.parse(line);
      const candidate =
        entry?.type === "preview" ? entry.preview_urls?.[0] : undefined;
      if (typeof candidate === "string" && candidate.trim()) {
        url = candidate.trim();
      }
    } catch {
      // 不正な JSON 行は無視します。
    }
  }
  if (!url) {
    throw new Error("preview の preview_urls が見つかりません");
  }
  if (!URL.canParse(url)) {
    throw new Error(`preview_urls が URL ではありません: ${url}`);
  }
  return new URL(url).href;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    console.log(parsePreviewUrl(readFileSync(process.argv[2], "utf8")));
  } catch (error) {
    console.error(`Preview URL の取得に失敗しました: ${error.message}`);
    process.exitCode = 1;
  }
}
