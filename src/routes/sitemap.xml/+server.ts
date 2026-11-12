import { buildSitemapXml } from "../../lib/server/agent-ready/sitemap";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  const body = await buildSitemapXml(url.origin);
  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
