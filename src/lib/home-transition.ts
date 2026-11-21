export function homeTransitionDirection(
  from: string,
  to: string
): "in" | "out" | null {
  if (from === "/" && to !== "" && to !== "/") {
    return "out";
  }
  if (to === "/" && from !== "" && from !== "/") {
    return "in";
  }
  return null;
}
