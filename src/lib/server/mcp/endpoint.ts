import {
  hostHeaderValidationResponse,
  originValidationResponse,
} from "@modelcontextprotocol/server";
import { type AccessEnvironment, authenticateAccessRequest } from "./access";
import { handleSiteMcpRequest } from "./server";

const allowedHostnames = ["nyatinte.com", "localhost", "127.0.0.1"];

export async function handleMcpRequest(
  request: Request,
  environment: AccessEnvironment
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

  return handleSiteMcpRequest(request, authInfo);
}
