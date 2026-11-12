import {
  type AuthInfo,
  createMcpHandler,
  type McpHttpHandler,
  McpServer,
} from "@modelcontextprotocol/server";

export function createSiteMcpHandler(): McpHttpHandler {
  return createMcpHandler(
    () => {
      const server = new McpServer({ name: "nyatinte.com", version: "1.0.0" });
      return server;
    },
    { responseMode: "json" }
  );
}

export async function handleSiteMcpRequest(
  request: Request,
  authInfo: AuthInfo
): Promise<Response> {
  const handler = createSiteMcpHandler();
  try {
    return await handler.fetch(request, { authInfo });
  } finally {
    await handler.close();
  }
}
