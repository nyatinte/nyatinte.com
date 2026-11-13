const staticAssetPattern = /\.[a-z0-9]{1,12}$/iu;
const logSlugPattern = /^\/log\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/u;

export type AgentRoute =
  | { canonicalPath: "/"; kind: "home" }
  | { canonicalPath: "/log"; kind: "log-list" }
  | { canonicalPath: string; kind: "log-detail"; slug: string }
  | { canonicalPath: string; kind: "not-found" };

function shouldSkipAgentHandling(pathname: string): boolean {
  return (
    pathname.startsWith("/mcp") ||
    pathname === "/llms.txt" ||
    pathname === "/sitemap.xml" ||
    staticAssetPattern.test(pathname)
  );
}

export function matchAgentRoute(pathname: string): AgentRoute | null {
  if (shouldSkipAgentHandling(pathname)) {
    return null;
  }
  if (pathname === "/") {
    return { canonicalPath: "/", kind: "home" };
  }
  if (pathname === "/log") {
    return { canonicalPath: "/log", kind: "log-list" };
  }
  const detailMatch = pathname.match(logSlugPattern);
  const slug = detailMatch?.[1];
  if (slug) {
    return {
      canonicalPath: `/log/${slug}`,
      kind: "log-detail",
      slug,
    };
  }
  return { canonicalPath: pathname, kind: "not-found" };
}
