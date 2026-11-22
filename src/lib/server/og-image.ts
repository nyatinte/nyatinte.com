import ogImage from "../../routes/og.png";
import { canonicalSiteUrl } from "./agent-ready/constants";

/** frontmatter に画像がないページで使う共通 OGP 画像の絶対 URL。 */
export function resolvePageOgImage() {
  return new URL(ogImage, canonicalSiteUrl("/")).href;
}
