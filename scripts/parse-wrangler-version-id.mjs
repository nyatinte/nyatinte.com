import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const newlinePattern = /\r?\n/;
const versionIdPattern = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

export function parseVersionId(jsonl) {
  let versionId;
  for (const line of jsonl.split(newlinePattern)) {
    try {
      const entry = JSON.parse(line);
      if (
        entry?.type === "version-upload" &&
        typeof entry.version_id === "string" &&
        entry.version_id.trim()
      ) {
        versionId = entry.version_id.trim();
      }
    } catch {
      // 不正な JSON 行は無視します。
    }
  }
  if (!versionId) {
    throw new Error("version-upload の version_id が見つかりません");
  }
  if (!versionIdPattern.test(versionId)) {
    throw new Error(
      `version-upload の version_id が UUID 形式ではありません: ${versionId}`
    );
  }
  return versionId;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    console.log(parseVersionId(readFileSync(process.argv[2], "utf8")));
  } catch (error) {
    console.error(`Version ID の取得に失敗しました: ${error.message}`);
    process.exitCode = 1;
  }
}
