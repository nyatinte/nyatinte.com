import { resolveArticleImage } from "../../lib/log/og-image";
import { canonicalSiteUrl } from "../../lib/server/agent-ready/constants";
import { resolvePageOgImage } from "../../lib/server/og-image";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = () => ({
  canonicalUrl: canonicalSiteUrl("/pogo"),
  image: resolveArticleImage({ sharedUrl: resolvePageOgImage() }),
});
