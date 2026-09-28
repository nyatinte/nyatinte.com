import {
  type AuthInfo,
  createMcpHandler,
  type McpHttpHandler,
  McpServer,
} from "@modelcontextprotocol/server";
import type { AnyD1Database } from "drizzle-orm/d1";
import { ValiError } from "valibot";
import z from "zod/v4";
import {
  AchievementNotFoundError,
  type AchievementRecord,
  createAchievementRepository,
  RevisionConflictError,
} from "../achievement/repository";
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

const createSchema = z
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

const listSchema = z
  .object({
    cursor: z.string().max(128).optional(),
    include_deleted: z.boolean().optional().default(false),
    limit: z.number().int().min(1).max(100).optional().default(20),
    tags: z.array(z.string().trim().min(1)).max(20).optional().default([]),
  })
  .strict();

const getSchema = z
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

const updateSchema = z
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

const deleteSchema = z
  .object({
    expected_revision: z.number().int().positive(),
    id: z.string().trim().min(1).max(120),
  })
  .strict();

const restoreSchema = z
  .object({ id: z.string().trim().min(1).max(120) })
  .strict();

function fullRecord(record: AchievementRecord) {
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
    published_at: record.publishedAt,
    revision: record.revision,
    slug: record.slug,
    summary: record.summary,
    tags: record.tags.map(({ name, normalized }) => ({ name, normalized })),
    title: record.title,
    updated_at: record.updatedAt,
  };
}

function listRecord(record: AchievementRecord) {
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

  if (error instanceof AchievementNotFoundError) {
    code = "not_found";
    message = "Achievement not found. Check its id or slug and try again.";
  } else if (error instanceof RevisionConflictError) {
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

function withToolErrors<T>(
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

function createInput(
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

function updateInput(
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

export function createAchievementMcpHandler(
  database: AnyD1Database
): McpHttpHandler {
  const repository = createAchievementRepository(database);

  return createMcpHandler(
    ({ requestInfo }) => {
      const server = new McpServer({ name: "nyatinte.com", version: "1.0.0" });
      const origin = requestInfo
        ? new URL(requestInfo.url).origin
        : "https://nyatinte.com";

      server.registerTool(
        "create_achievement",
        {
          annotations: {
            destructiveHint: false,
            openWorldHint: false,
            readOnlyHint: false,
          },
          description:
            "Create and immediately publish an achievement. Supply a title and short summary; all other fields are optional.",
          inputSchema: createSchema,
          title: "Create achievement",
        },
        withToolErrors(async (input: z.output<typeof createSchema>) => {
          const created = await repository.create(createInput(input));
          return {
            id: created.id,
            revision: created.revision,
            slug: created.slug,
            url: new URL(`/done/${encodeURIComponent(created.slug)}`, origin)
              .href,
          };
        })
      );

      server.registerTool(
        "list_achievements",
        {
          annotations: { openWorldHint: false, readOnlyHint: true },
          description:
            "List achievements in occurrence-date order. Results are concise; use get_achievement for full details.",
          inputSchema: listSchema,
          title: "List achievements",
        },
        withToolErrors(async (input: z.output<typeof listSchema>) => {
          const page = await repository.list({
            cursor: input.cursor,
            includeDeleted: input.include_deleted,
            limit: input.limit,
            tags: input.tags,
          });
          return {
            items: page.items.map(listRecord),
            next_cursor: page.nextCursor,
          };
        })
      );

      server.registerTool(
        "get_achievement",
        {
          annotations: { openWorldHint: false, readOnlyHint: true },
          description:
            "Get one achievement by id or slug, including deleted records and the current revision.",
          inputSchema: getSchema,
          title: "Get achievement",
        },
        withToolErrors(async (input: z.output<typeof getSchema>) => {
          const record = await repository.get(input.id ?? input.slug ?? "", {
            includeDeleted: true,
          });
          if (!record) {
            throw new AchievementNotFoundError();
          }
          return fullRecord(record);
        })
      );

      server.registerTool(
        "update_achievement",
        {
          annotations: {
            destructiveHint: true,
            openWorldHint: false,
            readOnlyHint: false,
          },
          description:
            "Update only the supplied fields. expected_revision is required to prevent overwriting concurrent edits.",
          inputSchema: updateSchema,
          title: "Update achievement",
        },
        withToolErrors(async (input: z.output<typeof updateSchema>) => {
          const updated = await repository.update(
            input.id,
            input.expected_revision,
            updateInput(input)
          );
          return {
            id: updated.id,
            revision: updated.revision,
            slug: updated.slug,
          };
        })
      );

      server.registerTool(
        "delete_achievement",
        {
          annotations: {
            destructiveHint: true,
            openWorldHint: false,
            readOnlyHint: false,
          },
          description:
            "Soft-delete an achievement at the expected revision. It can be restored later.",
          inputSchema: deleteSchema,
          title: "Delete achievement",
        },
        withToolErrors(async (input: z.output<typeof deleteSchema>) => {
          const deleted = await repository.delete(
            input.id,
            input.expected_revision
          );
          return {
            deleted_at: deleted.deletedAt,
            id: deleted.id,
            revision: deleted.revision,
          };
        })
      );

      server.registerTool(
        "restore_achievement",
        {
          annotations: {
            destructiveHint: true,
            openWorldHint: false,
            readOnlyHint: false,
          },
          description:
            "Restore the latest saved non-deleted revision of an achievement.",
          inputSchema: restoreSchema,
          title: "Restore achievement",
        },
        withToolErrors(async (input: z.output<typeof restoreSchema>) => {
          const restored = await repository.restore(input.id);
          return { id: restored.id, revision: restored.revision };
        })
      );

      return server;
    },
    { responseMode: "json" }
  );
}

export async function handleAchievementMcpRequest(
  request: Request,
  database: AnyD1Database,
  authInfo: AuthInfo
): Promise<Response> {
  const handler = createAchievementMcpHandler(database);
  try {
    return await handler.fetch(request, { authInfo });
  } finally {
    await handler.close();
  }
}
