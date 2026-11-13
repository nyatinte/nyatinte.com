const articlePath = /^\/log\/[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const trailingSlash = /\/$/u;

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
