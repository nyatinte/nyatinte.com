import { env } from "cloudflare:test";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { expect, test } from "vite-plus/test";
import { createAchievementMcpHandler } from "../../src/lib/server/mcp/server";

test("supports the complete achievement management workflow over MCP HTTP", async () => {
  const handler = createAchievementMcpHandler(env.DB);
  const seenServiceTokenHeaders: string[] = [];
  const transport = new StreamableHTTPClientTransport(
    new URL("https://nyatinte.com/mcp"),
    {
      fetch: (url, init) => {
        const request = new Request(url, init);
        seenServiceTokenHeaders.push(
          `${request.headers.get("cf-access-client-id")}:${request.headers.get("cf-access-client-secret")}`
        );
        return handler.fetch(request, {
          authInfo: {
            clientId: "test-client",
            scopes: [],
            token: "test-access-jwt",
          },
        });
      },
      requestInit: {
        headers: {
          "Cf-Access-Client-Id": "test-service-client",
          "Cf-Access-Client-Secret": "test-service-secret",
        },
      },
    }
  );
  const client = new Client(
    { name: "nyatinte-mcp-test", version: "1.0.0" },
    { versionNegotiation: { mode: "auto" } }
  );

  try {
    await client.connect(transport);
    const tools = await client.listTools();
    expect(tools.tools.map(({ name }) => name).sort()).toEqual([
      "create_achievement",
      "delete_achievement",
      "get_achievement",
      "list_achievements",
      "restore_achievement",
      "update_achievement",
    ]);

    const created = await client.callTool({
      arguments: {
        body_markdown: "## Details\n\nMCP から作成した。",
        links: [{ label: "Source", url: "https://example.com/source" }],
        occurred_at: "2026-09-27",
        summary: "ローカル D1 へ MCP 経由で保存した。",
        tags: ["MCP", "D1"],
        title: "MCP 結合テスト",
      },
      name: "create_achievement",
    });
    expect(created.isError).not.toBe(true);
    expect(created.structuredContent).toMatchObject({ revision: 1 });
    const createdData = created.structuredContent as {
      id: string;
      slug: string;
      url: string;
    };
    expect(createdData.url).toBe(
      `https://nyatinte.com/done/${encodeURIComponent(createdData.slug)}`
    );

    const listed = await client.callTool({
      arguments: { limit: 10, tags: ["mcp"] },
      name: "list_achievements",
    });
    expect(listed.structuredContent).toMatchObject({
      items: [
        {
          id: createdData.id,
          tags: [{ name: "D1" }, { name: "MCP" }],
        },
      ],
    });

    const fetched = await client.callTool({
      arguments: { slug: createdData.slug },
      name: "get_achievement",
    });
    expect(fetched.structuredContent).toMatchObject({
      body_markdown: "## Details\n\nMCP から作成した。",
      id: createdData.id,
      revision: 1,
      title: "MCP 結合テスト",
    });

    const updated = await client.callTool({
      arguments: {
        expected_revision: 1,
        id: createdData.id,
        summary: "MCP から編集した。",
        tags: ["updated"],
      },
      name: "update_achievement",
    });
    expect(updated.structuredContent).toMatchObject({
      id: createdData.id,
      revision: 2,
      slug: createdData.slug,
    });

    const conflict = await client.callTool({
      arguments: {
        expected_revision: 1,
        id: createdData.id,
        summary: "stale update",
      },
      name: "update_achievement",
    });
    expect(conflict.isError).toBe(true);
    expect(conflict.content).toContainEqual(
      expect.objectContaining({ text: expect.stringContaining("revision") })
    );

    const deleted = await client.callTool({
      arguments: { expected_revision: 2, id: createdData.id },
      name: "delete_achievement",
    });
    expect(deleted.structuredContent).toMatchObject({
      id: createdData.id,
      revision: 3,
    });

    const includedDeleted = await client.callTool({
      arguments: { include_deleted: true, tags: ["updated"] },
      name: "list_achievements",
    });
    expect(includedDeleted.structuredContent).toMatchObject({
      items: [{ deleted_at: expect.any(String), id: createdData.id }],
    });

    const deletedEntry = await client.callTool({
      arguments: { id: createdData.id },
      name: "get_achievement",
    });
    expect(deletedEntry.structuredContent).toMatchObject({
      deleted_at: expect.any(String),
      revision: 3,
    });

    const visibleAfterDelete = await client.callTool({
      arguments: { tags: ["updated"] },
      name: "list_achievements",
    });
    expect(visibleAfterDelete.structuredContent).toMatchObject({ items: [] });

    const restore = await client.callTool({
      arguments: { id: createdData.id },
      name: "restore_achievement",
    });
    expect(restore.structuredContent).toMatchObject({
      id: createdData.id,
      revision: 4,
    });

    const restored = await client.callTool({
      arguments: { id: createdData.id },
      name: "get_achievement",
    });
    expect(restored.structuredContent).toMatchObject({
      deleted_at: null,
      revision: 4,
      summary: "MCP から編集した。",
      tags: [{ name: "updated" }],
    });
    expect(seenServiceTokenHeaders.length).toBeGreaterThan(1);
    expect(
      seenServiceTokenHeaders.every((value) =>
        value.startsWith("test-service-client:test-service-secret")
      )
    ).toBe(true);

    const minimal = await client.callTool({
      arguments: { summary: "短い説明だけで公開した。", title: "最小の実績" },
      name: "create_achievement",
    });
    expect(minimal.structuredContent).toMatchObject({ revision: 1 });
    const minimalId = (minimal.structuredContent as { id: string }).id;
    const minimalEntry = await client.callTool({
      arguments: { id: minimalId },
      name: "get_achievement",
    });
    expect(minimalEntry.structuredContent).toMatchObject({
      body_markdown: null,
      published_at: expect.any(String),
      summary: "短い説明だけで公開した。",
      title: "最小の実績",
    });
  } finally {
    await client.close();
    await handler.close();
  }
});
