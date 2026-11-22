import { markdownContentType } from "../../lib/server/agent-ready/constants";
import { buildLlmsTxt } from "../../lib/server/agent-ready/llms-txt";
import type { RequestHandler } from "./$types";

const headers = {
  "Cache-Control": "public, max-age=3600",
  "Content-Type": markdownContentType,
};

export const GET: RequestHandler = () =>
  new Response(buildLlmsTxt(), { headers });

export const HEAD: RequestHandler = () => new Response(null, { headers });
