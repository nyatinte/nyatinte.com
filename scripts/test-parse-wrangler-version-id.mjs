import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parseVersionId } from "./parse-wrangler-version-id.mjs";

const expected = "136328e2-6a45-4020-8f34-c072f743b031";
const workerTag = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

test("upload 行から Version ID を取得して worker_tag は使わない", () => {
  // Given: upload 行と worker_tag を含むログ
  const log = `${JSON.stringify({ type: "wrangler-session" })}\n${JSON.stringify({ type: "version-upload", version_id: expected, worker_tag: workerTag })}`;
  // When: Version ID を解析する
  const versionId = parseVersionId(log);
  // Then: upload 行の Version ID を返す
  assert.equal(versionId, expected);
});

test("最後の upload 行を使い、不正な JSON 行を無視する", () => {
  // Given: 複数の upload 行と不正な JSON 行
  const next = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const log = `not json\n${JSON.stringify({ type: "version-upload", version_id: expected })}\n${JSON.stringify({ type: "version-upload", version_id: next })}`;
  // When: Version ID を解析する
  const versionId = parseVersionId(log);
  // Then: 最後の upload 行の ID を返す
  assert.equal(versionId, next);
});

test("upload 行でない入力や不正な ID を拒否する", () => {
  // Given: upload 行でない入力または形式が不正な ID
  const inputs = [
    "",
    JSON.stringify({ type: "deploy", version_id: expected }),
    JSON.stringify({ type: "version-upload", version_id: null }),
    JSON.stringify({ type: "version-upload", version_id: "nope" }),
  ];
  // When: 各入力を解析する
  // Then: すべての入力で例外を投げる
  for (const input of inputs) {
    assert.throws(() => parseVersionId(input));
  }
});

test("入力ファイルがない場合や空の場合、CLI は失敗する", () => {
  // Given: 存在しないファイルと空のファイル
  const dir = mkdtempSync(join(tmpdir(), "parse-version-id-"));
  try {
    const empty = join(dir, "empty.jsonl");
    writeFileSync(empty, "");
    // When: CLI にそれぞれのファイルを渡す
    const statuses = [join(dir, "missing.jsonl"), empty].map(
      (file) =>
        spawnSync(process.execPath, [
          "scripts/parse-wrangler-version-id.mjs",
          file,
        ]).status
    );
    // Then: どちらも失敗する
    for (const status of statuses) {
      assert.notEqual(status, 0);
    }
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});
