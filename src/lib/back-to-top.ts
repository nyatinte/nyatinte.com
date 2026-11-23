export const backToTopThreshold = 300;

export function shouldShowBackToTop(scrollY: number): boolean {
  return scrollY >= backToTopThreshold;
}

export function backToTopScrollBehavior(
  prefersReducedMotion: boolean,
): ScrollBehavior {
  return prefersReducedMotion ? "instant" : "smooth";
}
