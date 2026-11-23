import ogImage from "../../routes/og.png";
import { canonicalSiteUrl } from "./agent-ready/constants";

export function resolvePageOgImage() {
  return new URL(ogImage, canonicalSiteUrl("/")).href;
}
