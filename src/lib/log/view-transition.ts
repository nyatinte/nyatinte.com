const articlePath = /^\/log\/[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function shouldStartArticleTransition(from: string, to: string) {
  return from === "/log" && articlePath.test(to);
}
