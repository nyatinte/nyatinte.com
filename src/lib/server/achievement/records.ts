import {
  array,
  description,
  examples,
  type InferOutput,
  integer,
  maxLength,
  minLength,
  minValue,
  nullable,
  number,
  parse,
  pipe,
  regex,
  strictObject,
  string,
} from "valibot";
import { dateOnly, httpUrl, normalizeTag } from "./validation";

export const recordSchema = strictObject({
  bodyMarkdown: pipe(
    nullable(pipe(string(), maxLength(20_000))),
    description("Markdown の詳細"),
    examples(["## 詳細\n\n記録の本文", null])
  ),
  changeId: pipe(
    string(),
    regex(/^[0-9a-f-]{36}$/u),
    description("更新ごとの競合検出用識別子"),
    examples(["01998f36-8980-7a64-bd0d-70bb30c7d903"])
  ),
  coverImageUrl: pipe(
    nullable(httpUrl),
    description("カバー画像の URL"),
    examples(["https://example.com/image.png", null])
  ),
  createdAt: pipe(
    string(),
    description("作成日時"),
    examples(["2026-01-01T00:00:00.000Z"])
  ),
  deletedAt: pipe(
    nullable(string()),
    description("削除日時。未削除なら null"),
    examples([null])
  ),
  id: pipe(
    string(),
    regex(/^[0-9a-f-]{36}$/u),
    description("実績の識別子"),
    examples(["01998f36-8980-7a64-bd0d-70bb30c7d901"])
  ),
  links: pipe(
    array(
      strictObject({
        id: pipe(
          string(),
          description("リンクの識別子"),
          examples(["01998f36-8980-7a64-bd0d-70bb30c7d902"])
        ),
        label: pipe(
          nullable(string()),
          description("リンクの表示名"),
          examples(["ソース", null])
        ),
        position: pipe(number(), description("表示順"), examples([0])),
        url: pipe(
          httpUrl,
          description("リンク先 URL"),
          examples(["https://example.com/"])
        ),
      })
    ),
    description("関連リンク"),
    examples([[]])
  ),
  occurredAt: pipe(
    dateOnly,
    description("実績の日付"),
    examples(["2026-01-01"])
  ),
  revision: pipe(
    number(),
    integer(),
    minValue(1),
    description("実績の更新番号"),
    examples([1])
  ),
  slug: pipe(
    string(),
    regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    maxLength(120),
    description("詳細ページの識別子"),
    examples(["first-achievement"])
  ),
  summary: pipe(
    string(),
    minLength(1),
    maxLength(200),
    description("短い説明"),
    examples(["サイトを公開した"])
  ),
  tags: pipe(
    array(
      strictObject({
        name: pipe(string(), description("タグの表示名"), examples(["Git"])),
        normalized: pipe(
          string(),
          description("検索用に正規化したタグ"),
          examples(["git"])
        ),
      })
    ),
    description("実績のタグ"),
    examples([[]])
  ),
  title: pipe(
    string(),
    minLength(1),
    maxLength(120),
    description("実績のタイトル"),
    examples(["サイトを公開"])
  ),
  updatedAt: pipe(
    string(),
    description("最終更新日時"),
    examples(["2026-01-01T00:00:00.000Z"])
  ),
});

export type AchievementRecord = InferOutput<typeof recordSchema>;
export interface AchievementListOptions {
  cursor?: string;
  includeDeleted?: boolean;
  limit?: number;
  tags?: string[];
}

export function parseRecord(source: string): AchievementRecord {
  const boundary = source.indexOf("\n---\n", 4);
  if (!source.startsWith("---\n") || boundary < 0) {
    throw new TypeError("Invalid achievement document");
  }
  const metadata: unknown = JSON.parse(source.slice(4, boundary));
  const bodyMarkdown = source.slice(boundary + 5);
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new TypeError("Invalid achievement metadata");
  }
  return parse(recordSchema, {
    ...metadata,
    bodyMarkdown: bodyMarkdown || null,
  });
}

export function serializeRecord(record: AchievementRecord): string {
  const { bodyMarkdown, ...metadata } = parse(recordSchema, record);
  return `---\n${JSON.stringify(metadata, null, 2)}\n---\n${bodyMarkdown ?? ""}`;
}

export function listRecords(
  records: AchievementRecord[],
  options: AchievementListOptions = {}
) {
  const requestedLimit = options.limit ?? 20;
  if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {
    throw new RangeError("List limit must be a positive integer");
  }
  const limit = Math.min(requestedLimit, 100);
  const tags = [
    ...new Set((options.tags ?? []).map(normalizeTag).filter(Boolean)),
  ];
  const ordered = records
    .filter(
      (record) =>
        (options.includeDeleted || !record.deletedAt) &&
        tags.every((tag) => record.tags.some((item) => item.normalized === tag))
    )
    .sort(
      (a, b) =>
        b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id)
    );
  let start = 0;
  if (options.cursor) {
    const [date, id, extra] = options.cursor.split("~");
    if (!(date && id) || extra !== undefined) {
      throw new TypeError("Invalid achievement cursor");
    }
    start = ordered.findIndex(
      (item) =>
        item.occurredAt < date || (item.occurredAt === date && item.id > id)
    );
    if (start < 0) {
      return { items: [], nextCursor: null };
    }
  }
  const items = ordered.slice(start, start + limit);
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      start + limit < ordered.length && last
        ? `${last.occurredAt}~${last.id}`
        : null,
  };
}
