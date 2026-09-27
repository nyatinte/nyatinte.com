import {
  hostHeaderValidationResponse,
  originValidationResponse,
} from "@modelcontextprotocol/server";
import type { AnyD1Database } from "drizzle-orm/d1";
import { type AccessEnvironment, authenticateAccessRequest } from "./access";
import { handleAchievementMcpRequest } from "./server";

export interface McpEnvironment extends AccessEnvironment {
  DB?: AnyD1Database;
}

const allowedHostnames = ["nyatinte.com", "localhost", "127.0.0.1"];

export async function handleMcpRequest(
  request: Request,
  environment: McpEnvironment
): Promise<Response> {
  const headerError =
    hostHeaderValidationResponse(request, allowedHostnames) ??
    originValidationResponse(request, allowedHostnames);
  if (headerError) {
    return headerError;
  }

  const authInfo = await authenticateAccessRequest(request, environment);
  if (authInfo instanceof Response) {
    return authInfo;
  }
  if (!environment.DB) {
    return Response.json(
      { error: "The MCP database is unavailable." },
      { headers: { "cache-control": "no-store" }, status: 503 }
    );
  }

  return handleAchievementMcpRequest(request, environment.DB, authInfo);
}
