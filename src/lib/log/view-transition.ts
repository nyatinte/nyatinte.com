const articlePath = /^\/log\/[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const trailingSlash = /\/$/u;

export function shouldStartArticleTransition(from: string, to: string) {
  const normalizedFrom = from.replace(trailingSlash, "");
  const normalizedTo = to.replace(trailingSlash, "");
  return (
    (normalizedFrom === "/log" && articlePath.test(normalizedTo)) ||
    (articlePath.test(normalizedFrom) && normalizedTo === "/log")
  );
}

export function articleTransitionName(slug: string) {
  return `log-title-${slug}`;
}

export function articleDateTransitionName(slug: string) {
  return `log-date-${slug}`;
}
