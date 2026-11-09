import {
  hostHeaderValidationResponse,
  originValidationResponse,
} from "@modelcontextprotocol/server";
import { type AccessEnvironment, authenticateAccessRequest } from "./access";
import { handleAchievementMcpRequest } from "./server";

export interface McpEnvironment extends AccessEnvironment {
  ACHIEVEMENT_GITHUB_TOKEN?: string;
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
  if (!environment.ACHIEVEMENT_GITHUB_TOKEN) {
    return Response.json(
      { error: "GitHub is not configured for this MCP service." },
      { headers: { "cache-control": "no-store" }, status: 503 }
    );
  }

  return handleAchievementMcpRequest(
    request,
    environment.ACHIEVEMENT_GITHUB_TOKEN,
    authInfo
  );
}
