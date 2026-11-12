import type { Handle } from "@sveltejs/kit/hooks";
import { wantsMarkdown } from "./lib/server/agent-ready/accept";
import { productionSiteHref } from "./lib/server/agent-ready/constants";
import {
  agentResponseHeaders,
  markdownResponse,
} from "./lib/server/agent-ready/headers";
import { renderAgentMarkdown } from "./lib/server/agent-ready/markdown";
import { matchAgentRoute } from "./lib/server/agent-ready/routes";

const jsonLdScriptPattern = /<script type="application\/ld\+json">/gu;
const cspNoncePattern = /'nonce-([^']+)'/u;
const agentReadMethods = new Set(["GET", "HEAD"]);

function isAgentReadMethod(method: string) {
  return agentReadMethods.has(method);
}

function shouldEnrichResponse(
  route: NonNullable<ReturnType<typeof matchAgentRoute>>,
  status: number
) {
  return (
    route.kind === "home" ||
    route.kind === "done-list" ||
    route.kind === "done-detail" ||
    (route.kind === "not-found" && status === 404)
  );
}

async function finalizeHtmlResponse(
  response: Response,
  enrichHeaders?: (headers: Headers) => void
): Promise<Response> {
  const headers = new Headers(response.headers);
  enrichHeaders?.(headers);
  const contentType = headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  }

  if (response.body === null) {
    return new Response(null, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  }

  const nonce = headers
    .get("content-security-policy")
    ?.match(cspNoncePattern)?.[1];
  let body = await response.text();
  if (nonce && jsonLdScriptPattern.test(body)) {
    jsonLdScriptPattern.lastIndex = 0;
    body = body.replaceAll(
      '<script type="application/ld+json">',
      `<script type="application/ld+json" nonce="${nonce}">`
    );
  }
  return new Response(body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export const handle: Handle = async ({ event, resolve }) => {
  const route = matchAgentRoute(event.url.pathname);
  if (
    isAgentReadMethod(event.request.method) &&
    wantsMarkdown(event.request) &&
    route
  ) {
    const rendered = await renderAgentMarkdown(route, event.url.searchParams);
    const body = event.request.method === "HEAD" ? null : rendered.body;
    return markdownResponse(body, {
      canonicalUrl: rendered.canonicalUrl,
      status: rendered.status,
    });
  }

  const response = await resolve(event);
  if (
    !(
      isAgentReadMethod(event.request.method) &&
      route &&
      shouldEnrichResponse(route, response.status)
    )
  ) {
    return finalizeHtmlResponse(response);
  }

  return finalizeHtmlResponse(response, (headers) => {
    const canonicalUrl = productionSiteHref(route.canonicalPath);
    const enriched = agentResponseHeaders({
      canonicalUrl,
      existingVary: headers.get("Vary"),
      includeAlternateLink: !wantsMarkdown(event.request),
    });
    for (const [key, value] of enriched.entries()) {
      headers.set(key, value);
    }
  });
};
