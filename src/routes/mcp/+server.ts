import type { RequestHandler } from "@sveltejs/kit";
import { handleMcpRequest } from "../../lib/server/mcp/endpoint";

const handle: RequestHandler = async ({ platform, request }) =>
  handleMcpRequest(
    request,
    platform?.env ?? (await import("cloudflare:workers")).env
  );

export { handle as DELETE, handle as GET, handle as POST };
