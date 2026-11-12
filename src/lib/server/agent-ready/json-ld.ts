import { logDescription, logTitle } from "../../log/constants";
import type { Article } from "../../log/frontmatter";
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

export function createLogJsonLd() {
  const url = canonicalSiteUrl("/log");
  return [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      author: {
        "@type": "Person",
        name: siteAuthor.name,
        url: canonicalSiteUrl("/"),
      },
      description: logDescription,
      inLanguage: siteIdentity.inLanguage,
      name: logTitle,
      url,
    },
  ] as const;
}

export function createArticleJsonLd(article: Article) {
  const url = canonicalSiteUrl(`/log/${article.slug}`);
  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      author: {
        "@type": "Person",
        name: siteAuthor.name,
        url: canonicalSiteUrl("/"),
      },
      dateModified: article.updated ?? article.date,
      datePublished: article.date,
      description: article.description,
      headline: article.title,
      inLanguage: siteIdentity.inLanguage,
      mainEntityOfPage: url,
      url,
    },
  ] as const;
}
