import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parseVersionId } from "./parse-wrangler-version-id.mjs";

const expected = "136328e2-6a45-4020-8f34-c072f743b031";
const workerTag = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

test("upload 行の Version ID を取り、worker_tag は使わない", () => {
  assert.equal(
    parseVersionId(
      `${JSON.stringify({ type: "wrangler-session" })}\n${JSON.stringify({ type: "version-upload", version_id: expected, worker_tag: workerTag })}`
    ),
    expected
  );
});

test("最後の upload 行を使い、不正な JSON 行は無視する", () => {
  const next = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  assert.equal(
    parseVersionId(
      `not json\n${JSON.stringify({ type: "version-upload", version_id: expected })}\n${JSON.stringify({ type: "version-upload", version_id: next })}`
    ),
    next
  );
});

test("upload 行以外や不正な ID は失敗する", () => {
  for (const input of [
    "",
    JSON.stringify({ type: "deploy", version_id: expected }),
    JSON.stringify({ type: "version-upload", version_id: null }),
    JSON.stringify({ type: "version-upload", version_id: "nope" }),
  ]) {
    assert.throws(() => parseVersionId(input));
  }
});

test("CLI はファイル無し・空ファイルで失敗する", () => {
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
