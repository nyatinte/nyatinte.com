import { createHomeJsonLd } from "../lib/server/agent-ready/json-ld";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ url }) => ({
  jsonLd: createHomeJsonLd(url.origin),
});
