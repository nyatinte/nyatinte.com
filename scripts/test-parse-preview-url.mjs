import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parsePreviewUrl } from "./parse-preview-url.mjs";

const first = "https://pr-1-nyatinte-com.nyatinte.workers.dev";
const second = "https://pr-2-nyatinte-com.nyatinte.workers.dev";

test("preview 行の preview_urls の先頭を使う", () => {
  assert.equal(
    parsePreviewUrl(
      `${JSON.stringify({ type: "wrangler-session" })}\n${JSON.stringify({ preview_urls: [second], type: "preview" })}`,
    ),
    `${second}/`,
  );
});

test("最後の preview 行を使い、不正な JSON 行は無視する", () => {
  assert.equal(
    parsePreviewUrl(
      `not json\n${JSON.stringify({ preview_urls: [first], type: "preview" })}\n${JSON.stringify({ preview_urls: [second], type: "preview" })}`,
    ),
    `${second}/`,
  );
});

test("preview 行以外や URL でない値は失敗する", () => {
  for (const input of [
    "",
    JSON.stringify({ deployment_urls: [first], type: "preview" }),
    JSON.stringify({ preview_urls: [], type: "preview" }),
    JSON.stringify({ preview_urls: ["nope"], type: "preview" }),
  ]) {
    assert.throws(() => parsePreviewUrl(input));
  }
});

test("CLI はファイル無し・空ファイルで失敗する", () => {
  const dir = mkdtempSync(join(tmpdir(), "parse-preview-url-"));
  try {
    const empty = join(dir, "empty.jsonl");
    writeFileSync(empty, "");
    for (const file of [join(dir, "missing.jsonl"), empty]) {
      assert.notEqual(
        spawnSync(process.execPath, ["scripts/parse-preview-url.mjs", file])
          .status,
        0,
      );
    }
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});
