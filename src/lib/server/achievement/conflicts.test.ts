import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import { type AchievementRecord, serializeRecord } from "./records";

test("concurrent edits to separate fields conflict instead of silently merging", () => {
  const directory = mkdtempSync(join(tmpdir(), "achievement-conflict-"));
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: directory, stdio: "pipe" });
  const record: AchievementRecord = {
    bodyMarkdown: null,
    changeId: "01998f36-8980-7a64-bd0d-70bb30c7d901",
    coverImageUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    id: "01998f36-8980-7a64-bd0d-70bb30c7d902",
    links: [],
    occurredAt: "2026-01-01",
    revision: 1,
    slug: "example",
    summary: "概要",
    tags: [],
    title: "記録",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const save = (value: AchievementRecord) =>
    writeFileSync(join(directory, "example.md"), serializeRecord(value));
  try {
    git("init", "-b", "main");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "Test");
    save(record);
    git("add", "example.md");
    git("commit", "-m", "initial");
    git("checkout", "-b", "first");
    save({
      ...record,
      changeId: "01998f36-8980-7a64-bd0d-70bb30c7d903",
      revision: 2,
      summary: "変更",
    });
    git("commit", "-am", "first");
    git("checkout", "main");
    git("checkout", "-b", "second");
    save({
      ...record,
      changeId: "01998f36-8980-7a64-bd0d-70bb30c7d904",
      revision: 2,
      title: "別の変更",
    });
    git("commit", "-am", "second");
    expect(() => git("merge", "first")).toThrow();
    expect(
      git("diff", "--name-only", "--diff-filter=U").toString().trim()
    ).toBe("example.md");
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});
