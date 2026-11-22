/** この位置まで縦スクロールしたら「上に戻る」ボタンを表示する。 */
export const backToTopThreshold = 300;

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
