import {
  array,
  check,
  description,
  examples,
  type InferOutput,
  maxLength,
  minLength,
  nullable,
  omit,
  optional,
  partial,
  pipe,
  regex,
  strictObject,
  string,
  trim,
  url,
} from "valibot";

export const dateOnly = pipe(
  string(),
  regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  check((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
    );
  }, "Expected a real calendar date")
);

export const httpUrl = pipe(
  string(),
  url(),
  check(
    (value) => ["http:", "https:"].includes(new URL(value).protocol),
    "Expected an HTTP(S) URL"
  )
);

const tagName = pipe(string(), trim(), minLength(1));

export const createAchievementInputSchema = strictObject({
  bodyMarkdown: pipe(
    optional(nullable(pipe(string(), maxLength(20_000)))),
    description("Markdown の詳細"),
    examples(["## 詳細\n\n記録の本文", null])
  ),
  coverImageUrl: pipe(
    optional(nullable(httpUrl)),
    description("カバー画像の URL"),
    examples(["https://example.com/image.png", null])
  ),
  links: pipe(
    optional(
      array(
        strictObject({
          label: pipe(
            optional(pipe(string(), trim(), maxLength(120))),
            description("リンクの表示名"),
            examples(["ソース"])
          ),
          url: pipe(
            httpUrl,
            description("リンク先 URL"),
            examples(["https://example.com/"])
          ),
        })
      )
    ),
    description("関連リンク"),
    examples([[{ label: "ソース", url: "https://example.com/" }]])
  ),
  occurredAt: pipe(
    optional(dateOnly),
    description("実績の日付"),
    examples(["2026-01-01"])
  ),
  slug: pipe(
    optional(
      pipe(string(), regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), maxLength(120))
    ),
    description("詳細ページの識別子"),
    examples(["first-achievement"])
  ),
  summary: pipe(
    string(),
    trim(),
    minLength(1),
    maxLength(200),
    description("短い説明"),
    examples(["サイトを公開した"])
  ),
  tags: pipe(
    optional(array(tagName)),
    description("実績のタグ"),
    examples([["Git"]])
  ),
  title: pipe(
    string(),
    trim(),
    minLength(1),
    maxLength(120),
    description("実績のタイトル"),
    examples(["サイトを公開"])
  ),
});

export const updateAchievementInputSchema = pipe(
  partial(omit(createAchievementInputSchema, ["slug"])),
  check(
    (input) => Object.keys(input).length > 0,
    "At least one field is required"
  )
);

export type CreateAchievementInput = InferOutput<
  typeof createAchievementInputSchema
>;
export type UpdateAchievementInput = InferOutput<
  typeof updateAchievementInputSchema
>;

export function normalizeTag(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
}

export function slugifyTitle(title: string): string {
  return (
    title
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, "-")
      .replace(/^-|-$/gu, "") || "achievement"
  );
}
