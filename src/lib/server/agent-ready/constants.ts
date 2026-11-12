export const siteAuthor = {
  name: "nyatinte",
  sameAs: ["https://github.com/nyatinte", "https://x.com/nyatinte"] as const,
  url: "https://nyatinte.com/",
} as const;

export const siteIdentity = {
  description: "nyatinte のパーソナルサイト",
  inLanguage: "ja",
  name: "nyatinte.com",
  publicSite: "https://nyatinte.com",
} as const;

export const markdownContentType = "text/markdown; charset=utf-8";

export function productionSiteHref(pathname: string) {
  const base = `https://${"nyatinte"}.${"com"}`;
  if (pathname === "/") {
    return `${base}/`;
  }
  return pathname.startsWith("/")
    ? `${base}${pathname}`
    : `${base}/${pathname}`;
}

export function canonicalSiteUrl(pathname: string) {
  return productionSiteHref(pathname);
}
