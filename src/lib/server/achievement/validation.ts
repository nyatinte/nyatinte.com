import {
  array,
  check,
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

const dateOnly = pipe(
  string(),
  regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  check((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
    );
  }, "Expected a real calendar date")
);

const httpUrl = pipe(
  string(),
  url(),
  check(
    (value) => ["http:", "https:"].includes(new URL(value).protocol),
    "Expected an HTTP(S) URL"
  )
);

const tagName = pipe(string(), trim(), minLength(1));

export const createAchievementInputSchema = strictObject({
  bodyMarkdown: optional(nullable(pipe(string(), maxLength(20_000)))),
  coverImageUrl: optional(nullable(httpUrl)),
  links: optional(
    array(
      strictObject({
        label: optional(pipe(string(), trim(), maxLength(120))),
        url: httpUrl,
      })
    )
  ),
  occurredAt: optional(dateOnly),
  slug: optional(
    pipe(string(), regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), maxLength(120))
  ),
  summary: pipe(string(), trim(), minLength(1), maxLength(200)),
  tags: optional(array(tagName)),
  title: pipe(string(), trim(), minLength(1), maxLength(120)),
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
