import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { expect, test, vi } from "vite-plus/test";
import { createAchievementRepository } from "../achievement/repository";
import { createAchievementMcpHandler } from "./server";

test("MCP creates an achievement pull request without claiming immediate publication", async () => {
  const store = {
    history: vi.fn().mockResolvedValue([]),
    list: vi.fn().mockResolvedValue([]),
    propose: vi
      .fn()
      .mockResolvedValue("https://github.com/nyatinte/nyatinte.com/pull/123"),
  };
  const handler = createAchievementMcpHandler(
    createAchievementRepository({ store })
  );
  const transport = new StreamableHTTPClientTransport(
    new URL("https://nyatinte.com/mcp"),
    {
      fetch: (url, init) =>
        handler.fetch(new Request(url, init), {
          authInfo: { clientId: "test", scopes: [], token: "test" },
        }),
    }
  );
  const client = new Client(
    { name: "test", version: "1.0.0" },
    { versionNegotiation: { mode: "auto" } }
  );
  try {
    await client.connect(transport);
    const result = await client.callTool({
      arguments: { summary: "概要", title: "実績" },
      name: "create_achievement",
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      pull_request_url: "https://github.com/nyatinte/nyatinte.com/pull/123",
      revision: 1,
    });
    expect(store.propose).toHaveBeenCalledOnce();
    const tools = await client.listTools();
    expect(
      tools.tools.find((tool) => tool.name === "create_achievement")
        ?.description
    ).toContain("pull request");
  } finally {
    await client.close();
    await handler.close();
  }
});
