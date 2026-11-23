import { resolveArticleImage } from "../lib/log/og-image";
import {
  canonicalSiteUrl,
  siteIdentity,
} from "../lib/server/agent-ready/constants";
import { createHomeJsonLd } from "../lib/server/agent-ready/json-ld";
import { resolvePageOgImage } from "../lib/server/og-image";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = () => ({
  canonicalUrl: canonicalSiteUrl("/"),
  image: resolveArticleImage({ sharedUrl: resolvePageOgImage() }),
  jsonLd: createHomeJsonLd(),
  siteDescription: siteIdentity.description,
});
