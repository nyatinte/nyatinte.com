const articlePath = /^\/log\/[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const trailingSlash = /\/$/u;

export function homeTransitionDirection(from: string, to: string) {
  if (from === "/" && to.replace(trailingSlash, "") === "/log") {
    return "out";
  }
  if (from.replace(trailingSlash, "") === "/log" && to === "/") {
    return "in";
  }
  return null;
}

export function shouldStartArticleTransition(from: string, to: string) {
  return (
    from.replace(trailingSlash, "") === "/log" &&
    articlePath.test(to.replace(trailingSlash, ""))
  );
}

export function articleTransitionName(slug: string) {
  return `log-title-${slug}`;
}

export function articleDateTransitionName(slug: string) {
  return `log-date-${slug}`;
}
