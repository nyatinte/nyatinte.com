const articlePath = /^\/log\/[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function homeTransitionDirection(from: string, to: string) {
  if (from === "/" && to === "/log") {
    return "out";
  }
  if (from === "/log" && to === "/") {
    return "in";
  }
  return null;
}

export function shouldStartArticleTransition(from: string, to: string) {
  return from === "/log" && articlePath.test(to);
}

export function articleTransitionName(slug: string) {
  return `log-${slug}`;
}
