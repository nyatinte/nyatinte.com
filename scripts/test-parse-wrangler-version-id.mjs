import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parseVersionId } from "./parse-wrangler-version-id.mjs";

const expected = "136328e2-6a45-4020-8f34-c072f743b031";
const workerTag = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

test("Given upload 行に Version ID と worker_tag があるとき、When ID を解析すると、Then Version ID を使う", () => {
  assert.equal(
    parseVersionId(
      `${JSON.stringify({ type: "wrangler-session" })}\n${JSON.stringify({ type: "version-upload", version_id: expected, worker_tag: workerTag })}`
    ),
    expected
  );
});

test("Given 複数の upload 行と不正な JSON 行、When ID を解析すると、Then 最後の upload 行を使い不正な行を無視する", () => {
  const next = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  assert.equal(
    parseVersionId(
      `not json\n${JSON.stringify({ type: "version-upload", version_id: expected })}\n${JSON.stringify({ type: "version-upload", version_id: next })}`
    ),
    next
  );
});

test("Given upload 行でない入力または不正な ID、When ID を解析すると、Then 失敗する", () => {
  for (const input of [
    "",
    JSON.stringify({ type: "deploy", version_id: expected }),
    JSON.stringify({ type: "version-upload", version_id: null }),
    JSON.stringify({ type: "version-upload", version_id: "nope" }),
  ]) {
    assert.throws(() => parseVersionId(input));
  }
});

test("Given CLI に存在しないファイルまたは空ファイルを渡すとき、When 実行すると、Then 失敗する", () => {
  const dir = mkdtempSync(join(tmpdir(), "parse-version-id-"));
  try {
    const empty = join(dir, "empty.jsonl");
    writeFileSync(empty, "");
    for (const file of [join(dir, "missing.jsonl"), empty]) {
      assert.notEqual(
        spawnSync(process.execPath, [
          "scripts/parse-wrangler-version-id.mjs",
          file,
        ]).status,
        0
      );
    }
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});
