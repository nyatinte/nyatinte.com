import { expect, test } from "vite-plus/test";
import {
  type AchievementRecord,
  listRecords,
  parseRecord,
  serializeRecord,
} from "./records";

const record: AchievementRecord = {
  bodyMarkdown: "## 詳細\n\n本文\n---\n続き",
  changeId: "01998f36-8980-7a64-bd0d-70bb30c7d903",
  coverImageUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
  id: "01998f36-8980-7a64-bd0d-70bb30c7d901",
  links: [],
  occurredAt: "2026-01-01",
  revision: 1,
  slug: "example",
  summary: "概要",
  tags: [{ name: "Git", normalized: "git" }],
  title: "記録",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

test("round-trips Markdown and rejects malformed metadata", () => {
  expect(parseRecord(serializeRecord(record))).toEqual(record);
  expect(() => parseRecord("---\n{}\n---\nbody")).toThrow();
  expect(() =>
    serializeRecord({ ...record, coverImageUrl: "javascript:alert(1)" })
  ).toThrow();
  expect(() =>
    serializeRecord({ ...record, occurredAt: "2026-02-30" })
  ).toThrow();
});

test("filters normalized tags and paginates in date order", () => {
  const older = {
    ...record,
    id: "01998f36-8980-7a64-bd0d-70bb30c7d902",
    occurredAt: "2025-12-31",
  };
  const first = listRecords([older, record], { limit: 1, tags: ["ＧＩＴ"] });
  expect(first.items).toEqual([record]);
  expect(
    listRecords([record, older], {
      cursor: first.nextCursor ?? undefined,
      limit: 1,
    }).items
  ).toEqual([older]);
  expect(() => listRecords([record], { cursor: "bad~cursor~extra" })).toThrow();
});
