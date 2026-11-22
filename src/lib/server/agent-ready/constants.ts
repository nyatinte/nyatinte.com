export const siteAuthor = {
  name: "nyatinte",
  sameAs: ["https://github.com/nyatinte", "https://x.com/nyatinte"] as const,
} as const;

export const siteIdentity = {
  description: "nyatinte のパーソナルサイト",
  inLanguage: "ja",
  name: "nyatinte.com",
  publicSite: "https://nyatinte.com",
} as const;

export const markdownContentType = "text/markdown; charset=utf-8";

export function canonicalSiteUrl(pathname: string) {
  const base = siteIdentity.publicSite;
  if (pathname === "/") {
    return `${base}/`;
  }
  return pathname.startsWith("/")
    ? `${base}${pathname}`
    : `${base}/${pathname}`;
}
