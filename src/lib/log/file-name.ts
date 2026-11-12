export function fileName(path: string) {
  const withoutQuery = path.split("?")[0] ?? path;
  const slash = Math.max(
    withoutQuery.lastIndexOf("/"),
    withoutQuery.lastIndexOf("\\")
  );
  return withoutQuery.slice(slash + 1);
}
