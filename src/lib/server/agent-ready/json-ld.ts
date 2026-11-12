import type { AchievementRecord } from "../achievement/records";
import { siteAuthor, siteIdentity } from "./constants";

export function createHomeJsonLd(origin: string) {
  const siteUrl = new URL("/", origin).href;
  const personId = `${siteUrl}#person`;
  return [
    {
      "@context": "https://schema.org",
      "@id": personId,
      "@type": "Person",
      name: siteAuthor.name,
      sameAs: [...siteAuthor.sameAs],
      url: siteUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      description: siteIdentity.description,
      inLanguage: siteIdentity.inLanguage,
      name: siteIdentity.name,
      publisher: { "@id": personId },
      url: siteUrl,
    },
  ] as const;
}

export function createBlogPostingJsonLd(
  origin: string,
  entry: AchievementRecord
) {
  const url = new URL(`/done/${entry.slug}`, origin).href;
  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      author: {
        "@type": "Person",
        name: siteAuthor.name,
        url: new URL("/", origin).href,
      },
      datePublished: entry.occurredAt,
      description: entry.summary,
      headline: entry.title,
      inLanguage: siteIdentity.inLanguage,
      mainEntityOfPage: url,
      url,
    },
  ] as const;
}
