import { markdownContentType } from "../../lib/server/agent-ready/constants";
import { buildLlmsTxt } from "../../lib/server/agent-ready/llms-txt";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () => {
  const body = buildLlmsTxt();
  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": markdownContentType,
    },
  });
};

export const HEAD: RequestHandler = () =>
  new Response(null, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": markdownContentType,
    },
  });
