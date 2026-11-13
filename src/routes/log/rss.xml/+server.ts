import { articles } from "../../../lib/log/articles";
import { buildRssXml } from "../../../lib/log/rss";
import type { RequestHandler } from "./$types";

const headers = {
  "Cache-Control": "public, max-age=3600",
  "Content-Type": "application/rss+xml; charset=utf-8",
};

export const GET: RequestHandler = () =>
  new Response(buildRssXml(articles), { headers });

export const HEAD: RequestHandler = () => new Response(null, { headers });
