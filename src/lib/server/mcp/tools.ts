import { ValiError } from "valibot";
import z from "zod/v4";
import type { AchievementRecord } from "../achievement/records";
import type {
  CreateAchievementInput,
  UpdateAchievementInput,
} from "../achievement/validation";

const httpUrl = z
  .url()
  .refine((value) => ["http:", "https:"].includes(new URL(value).protocol));

const linkSchema = z
  .object({
    label: z.string().trim().max(120).optional(),
    url: httpUrl,
  })
  .strict();

export const createSchema = z
  .object({
    body_markdown: z.string().max(20_000).nullable().optional(),
    cover_image_url: httpUrl.nullable().optional(),
    links: z.array(linkSchema).optional(),
    occurred_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/u)
      .optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
      .max(120)
      .optional(),
    summary: z.string().trim().min(1).max(200),
    tags: z.array(z.string().trim().min(1)).optional(),
    title: z.string().trim().min(1).max(120),
  })
  .strict();

export const listSchema = z
  .object({
    cursor: z.string().max(128).optional(),
    include_deleted: z.boolean().optional().default(false),
    limit: z.number().int().min(1).max(100).optional().default(20),
    tags: z.array(z.string().trim().min(1)).max(20).optional().default([]),
  })
  .strict();

export const getSchema = z
  .object({
    id: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
  .refine((input) => Boolean(input.id) !== Boolean(input.slug), {
    message: "Provide exactly one of id or slug.",
  });

const updateFields = {
  body_markdown: z.string().max(20_000).nullable().optional(),
  cover_image_url: httpUrl.nullable().optional(),
  links: z.array(linkSchema).optional(),
  occurred_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u)
    .optional(),
  summary: z.string().trim().min(1).max(200).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  title: z.string().trim().min(1).max(120).optional(),
};

export const updateSchema = z
  .object({
    expected_revision: z.number().int().positive(),
    id: z.string().trim().min(1).max(120),
    ...updateFields,
  })
  .strict()
  .refine(
    (input) =>
      Object.keys(updateFields).some(
        (field) => input[field as keyof typeof input] !== undefined
      ),
    { message: "At least one field must be changed." }
  );

export const deleteSchema = z
  .object({
    expected_revision: z.number().int().positive(),
    id: z.string().trim().min(1).max(120),
  })
  .strict();

export const restoreSchema = z
  .object({ id: z.string().trim().min(1).max(120) })
  .strict();

export function fullRecord(record: AchievementRecord) {
  return {
    body_markdown: record.bodyMarkdown,
    cover_image_url: record.coverImageUrl,
    created_at: record.createdAt,
    deleted_at: record.deletedAt,
    id: record.id,
    links: record.links.map(({ id, label, position, url }) => ({
      id,
      label,
      position,
      url,
    })),
    occurred_at: record.occurredAt,
    revision: record.revision,
    slug: record.slug,
    summary: record.summary,
    tags: record.tags.map(({ name, normalized }) => ({ name, normalized })),
    title: record.title,
    updated_at: record.updatedAt,
  };
}

export function listRecord(record: AchievementRecord) {
  return {
    deleted_at: record.deletedAt,
    id: record.id,
    occurred_at: record.occurredAt,
    revision: record.revision,
    slug: record.slug,
    summary: record.summary,
    tags: record.tags.map(({ name }) => ({ name })),
    title: record.title,
  };
}

function errorResult(error: unknown) {
  let code = "operation_failed";
  let message =
    "The operation could not be completed. Check the input and try again.";

  if (error instanceof Error && error.name === "AchievementNotFoundError") {
    code = "not_found";
    message = "Achievement not found. Check its id or slug and try again.";
  } else if (error instanceof Error && error.name === "RevisionConflictError") {
    code = "revision_conflict";
    message =
      "Revision conflict. Retrieve the latest achievement and retry with its current expected_revision.";
  } else if (error instanceof ValiError) {
    code = "invalid_input";
    message = error.issues.map(({ message: issue }) => issue).join("; ");
  } else if (
    error instanceof Error &&
    error.message === "No previous achievement revision to restore"
  ) {
    code = "nothing_to_restore";
    message = "No saved, non-deleted revision is available to restore.";
  } else if (error instanceof TypeError || error instanceof RangeError) {
    code = "invalid_input";
    message =
      "The cursor or limit is invalid. Start again with valid list options.";
  }

  return {
    content: [{ text: message, type: "text" as const }],
    isError: true,
    structuredContent: { error: { code, message } },
  };
}

export function withToolErrors<T>(
  action: (input: T) => Promise<Record<string, unknown>>
) {
  return async (input: T) => {
    try {
      const output = await action(input);
      return {
        content: [{ text: JSON.stringify(output), type: "text" as const }],
        structuredContent: output,
      };
    } catch (error) {
      return errorResult(error);
    }
  };
}

export function createInput(
  input: z.output<typeof createSchema>
): CreateAchievementInput {
  return {
    ...(input.body_markdown !== undefined && {
      bodyMarkdown: input.body_markdown,
    }),
    ...(input.cover_image_url !== undefined && {
      coverImageUrl: input.cover_image_url,
    }),
    ...(input.links !== undefined && {
      links: input.links.map(({ label, url }) => ({
        ...(label !== undefined && { label }),
        url,
      })),
    }),
    ...(input.occurred_at !== undefined && { occurredAt: input.occurred_at }),
    ...(input.slug !== undefined && { slug: input.slug }),
    summary: input.summary,
    ...(input.tags !== undefined && { tags: input.tags }),
    title: input.title,
  };
}

export function updateInput(
  input: z.output<typeof updateSchema>
): UpdateAchievementInput {
  return {
    ...(input.body_markdown !== undefined && {
      bodyMarkdown: input.body_markdown,
    }),
    ...(input.cover_image_url !== undefined && {
      coverImageUrl: input.cover_image_url,
    }),
    ...(input.links !== undefined && {
      links: input.links.map(({ label, url }) => ({
        ...(label !== undefined && { label }),
        url,
      })),
    }),
    ...(input.occurred_at !== undefined && { occurredAt: input.occurred_at }),
    ...(input.summary !== undefined && { summary: input.summary }),
    ...(input.tags !== undefined && { tags: input.tags }),
    ...(input.title !== undefined && { title: input.title }),
  };
}
