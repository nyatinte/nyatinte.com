const staticAssetPattern = /\.[a-z0-9]{1,12}$/iu;
const achievementSlugPattern = /^\/done\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/u;

export type AgentRoute =
  | { canonicalPath: "/"; kind: "home" }
  | { canonicalPath: "/done"; kind: "done-list" }
  | { canonicalPath: string; kind: "done-detail"; slug: string }
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
  if (pathname === "/done") {
    return { canonicalPath: "/done", kind: "done-list" };
  }
  const detailMatch = pathname.match(achievementSlugPattern);
  const [, slug] = detailMatch ?? [];
  if (slug) {
    return {
      canonicalPath: `/done/${slug}`,
      kind: "done-detail",
      slug,
    };
  }
  return { canonicalPath: pathname, kind: "not-found" };
}
