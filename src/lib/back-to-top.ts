/** この位置まで縦スクロールしたら「上に戻る」ボタンを表示する。 */
export const backToTopThreshold = 300;

/**
 * 先頭へ戻したあとのフォーカス先の候補。
 * ヘッダーのサイト名を優先し、無いページでは記事の見出しへ落とす。
 */
export const backToTopFocusSelectors = ["header .wordmark", "main h1"] as const;

/** フォーカスを移す要素を候補の順に探す。見つからなければ null。 */
export function findBackToTopFocusTarget(
  query: (selector: string) => HTMLElement | null
): HTMLElement | null {
  for (const selector of backToTopFocusSelectors) {
    const element = query(selector);
    if (element) {
      return element;
    }
  }
  return null;
}

/** ボタンを出すかどうか。初期表示とスクロールしないページでは false になる。 */
export function shouldShowBackToTop(scrollY: number): boolean {
  return scrollY >= backToTopThreshold;
}

/**
 * 先頭へ戻るときのスクロール挙動。
 * `instant` は記事ページの `html { scroll-behavior: smooth }` より優先される。
 */
export function backToTopScrollBehavior(
  prefersReducedMotion: boolean
): ScrollBehavior {
  return prefersReducedMotion ? "instant" : "smooth";
}
