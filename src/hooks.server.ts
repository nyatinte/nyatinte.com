import type { Handle } from "@sveltejs/kit/hooks";
import { wantsMarkdown } from "./lib/server/agent-ready/accept";
import { canonicalSiteUrl } from "./lib/server/agent-ready/constants";
import {
  agentResponseHeaders,
  markdownResponse,
} from "./lib/server/agent-ready/headers";
import { renderAgentMarkdown } from "./lib/server/agent-ready/markdown";
import { matchAgentRoute } from "./lib/server/agent-ready/routes";
import { legacyDoneLocation } from "./lib/server/legacy-redirect";

const jsonLdScriptTag = '<script type="application/ld+json">';
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
    route.kind === "log-list" ||
    route.kind === "log-detail" ||
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
  if (nonce && body.includes(jsonLdScriptTag)) {
    body = body.replaceAll(
      jsonLdScriptTag,
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
  const legacyLocation = legacyDoneLocation(event.url.pathname);
  if (legacyLocation) {
    return new Response(null, {
      headers: { location: legacyLocation },
      status: 301,
    });
  }

  const route = matchAgentRoute(event.url.pathname);
  if (
    isAgentReadMethod(event.request.method) &&
    wantsMarkdown(event.request) &&
    route
  ) {
    const rendered = renderAgentMarkdown(route);
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
    const enriched = agentResponseHeaders({
      canonicalUrl: canonicalSiteUrl(route.canonicalPath),
      existingVary: headers.get("Vary"),
      // markdown を希望するリクエストは上の分岐で返しているため、常に HTML になる。
      includeAlternateLink: true,
    });
    for (const [key, value] of enriched.entries()) {
      headers.set(key, value);
    }
  });
};
