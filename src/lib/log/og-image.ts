import { canonicalSiteUrl } from "../server/agent-ready/constants";
import { sharedOgAlt } from "./constants";

export interface ResolvedOgImage {
  alt: string;
  height?: string;
  type?: string;
  url: string;
  width?: string;
}

export function resolveArticleImage(options: {
  image?: string;
  sharedUrl: string;
  title?: string;
}): ResolvedOgImage {
  if (!options.image) {
    return {
      alt: sharedOgAlt,
      height: "630",
      type: "image/png",
      url: options.sharedUrl,
      width: "1200",
    };
  }
  const url = options.image.startsWith("/")
    ? new URL(options.image, canonicalSiteUrl("/")).href
    : options.image;
  return {
    alt: options.title ?? sharedOgAlt,
    url,
  };
}
