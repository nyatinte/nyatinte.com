import {
  type AuthInfo,
  createMcpHandler,
  type McpHttpHandler,
  McpServer,
} from "@modelcontextprotocol/server";
import type z from "zod/v4";
import { createAchievementRepository } from "../achievement/repository";
import {
  createInput,
  createSchema,
  deleteSchema,
  fullRecord,
  getSchema,
  listRecord,
  listSchema,
  restoreSchema,
  updateInput,
  updateSchema,
  withToolErrors,
} from "./tools";

export function createAchievementMcpHandler(
  repository: ReturnType<typeof createAchievementRepository>
): McpHttpHandler {
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
            openWorldHint: true,
            readOnlyHint: false,
          },
          description:
            "Create a pull request for an achievement. It is published only after the pull request is merged and the site is deployed.",
          inputSchema: createSchema,
          title: "Create achievement",
        },
        withToolErrors(async (input: z.output<typeof createSchema>) => {
          const created = await repository.create(createInput(input));
          return {
            id: created.id,
            pull_request_url: created.pullRequestUrl,
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
          annotations: { openWorldHint: true, readOnlyHint: true },
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
          annotations: { openWorldHint: true, readOnlyHint: true },
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
            throw Object.assign(new Error("Achievement not found"), {
              name: "AchievementNotFoundError",
            });
          }
          return fullRecord(record);
        })
      );

      server.registerTool(
        "update_achievement",
        {
          annotations: {
            destructiveHint: true,
            openWorldHint: true,
            readOnlyHint: false,
          },
          description:
            "Propose updates in a pull request. expected_revision is required to prevent overwriting concurrent edits.",
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
            pull_request_url: updated.pullRequestUrl,
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
            openWorldHint: true,
            readOnlyHint: false,
          },
          description:
            "Propose a soft deletion in a pull request. The achievement can be restored later.",
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
            pull_request_url: deleted.pullRequestUrl,
            revision: deleted.revision,
          };
        })
      );

      server.registerTool(
        "restore_achievement",
        {
          annotations: {
            destructiveHint: true,
            openWorldHint: true,
            readOnlyHint: false,
          },
          description:
            "Propose restoring the latest saved non-deleted revision in a pull request.",
          inputSchema: restoreSchema,
          title: "Restore achievement",
        },
        withToolErrors(async (input: z.output<typeof restoreSchema>) => {
          const restored = await repository.restore(input.id);
          return {
            id: restored.id,
            pull_request_url: restored.pullRequestUrl,
            revision: restored.revision,
          };
        })
      );

      return server;
    },
    { responseMode: "json" }
  );
}

export async function handleAchievementMcpRequest(
  request: Request,
  token: string,
  authInfo: AuthInfo
): Promise<Response> {
  const handler = createAchievementMcpHandler(
    createAchievementRepository({ token })
  );
  try {
    return await handler.fetch(request, { authInfo });
  } finally {
    await handler.close();
  }
}
