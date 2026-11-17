import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { expect, test } from "vite-plus/test";
import { createSiteMcpHandler } from "./server";

test("Given MCP サーバー、When 起動すると、Then ツールを登録しない", async () => {
  const handler = createSiteMcpHandler();
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
    const tools = await client.listTools();
    expect(tools.tools).toEqual([]);
  } finally {
    await client.close();
    await handler.close();
  }
});
