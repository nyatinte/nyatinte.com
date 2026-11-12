import { canonicalSiteUrl } from "../lib/server/agent-ready/constants";
import { createHomeJsonLd } from "../lib/server/agent-ready/json-ld";
import type { PageServerLoad } from "./$types";
import ogImage from "./og.png";

export const load: PageServerLoad = () => ({
  canonicalUrl: canonicalSiteUrl("/"),
  jsonLd: createHomeJsonLd(),
  ogImageUrl: new URL(ogImage, canonicalSiteUrl("/")).href,
});
