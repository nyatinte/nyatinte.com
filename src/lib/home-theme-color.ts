/** Light/dark arms of `--home-background` in `src/lib/styles/home-tokens.css`. */
export const HOME_THEME_COLOR = {
  dark: "oklch(23.64% 0.0423 254.98)",
  light: "oklch(88.02% 0.036 216.59)",
} as const;

export function readHomeBackgroundThemeColor(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--home-background")
    .trim();
}
