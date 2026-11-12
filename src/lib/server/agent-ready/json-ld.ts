import type { AchievementRecord } from "../achievement/records";
import { canonicalSiteUrl, siteAuthor, siteIdentity } from "./constants";

export function createHomeJsonLd() {
  const siteUrl = canonicalSiteUrl("/");
  const personId = `${siteUrl}#person`;
  return [
    {
      "@context": "https://schema.org",
      "@id": personId,
      "@type": "Person",
      description: siteIdentity.description,
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

export function createBlogPostingJsonLd(entry: AchievementRecord) {
  const url = canonicalSiteUrl(`/done/${entry.slug}`);
  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      author: {
        "@type": "Person",
        name: siteAuthor.name,
        url: canonicalSiteUrl("/"),
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
