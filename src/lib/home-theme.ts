export type HomeTheme = "light" | "dark";

export function readAppliedHomeTheme(): HomeTheme | null {
  const saved = document.documentElement.dataset.homeTheme;
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  return null;
}

export function nextHomeTheme(current: HomeTheme | null): HomeTheme {
  const dark = current
    ? current === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  return dark ? "light" : "dark";
}

export function homeThemeMessage(theme: HomeTheme) {
  return `${theme === "dark" ? "ダーク" : "ライト"}モードに切り替えました`;
}

export function persistHomeTheme(theme: HomeTheme) {
  document.documentElement.dataset.homeTheme = theme;
  try {
    localStorage.setItem("nyatinte-home-theme", theme);
  } catch {
    // The current page remains usable when storage is unavailable.
  }
}
