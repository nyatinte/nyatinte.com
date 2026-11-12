import { markdownContentType } from "./constants";

export function appendVary(
  existing: string | null | undefined,
  value: string
): string {
  const values = new Set(
    (existing ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  );
  values.add(value);
  return [...values].join(", ");
}

export function markdownAlternateLink(canonicalUrl: string): string {
  return `<${canonicalUrl}>; rel="alternate"; type="text/markdown"`;
}

export function agentResponseHeaders(options: {
  canonicalUrl: string;
  existingVary?: string | null;
  includeAlternateLink: boolean;
}): Headers {
  const headers = new Headers();
  headers.set("Vary", appendVary(options.existingVary ?? null, "Accept"));
  if (options.includeAlternateLink) {
    headers.set("Link", markdownAlternateLink(options.canonicalUrl));
  }
  return headers;
}

export function markdownResponse(
  body: string,
  options: {
    canonicalUrl: string;
    status: number;
  }
): Response {
  const headers = agentResponseHeaders({
    canonicalUrl: options.canonicalUrl,
    includeAlternateLink: false,
  });
  headers.set("Content-Type", markdownContentType);
  return new Response(body, { headers, status: options.status });
}
