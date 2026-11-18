export function fileName(path: string) {
  const withoutQuery = path.split("?")[0] ?? path;
  const slash = Math.max(
    withoutQuery.lastIndexOf("/"),
    withoutQuery.lastIndexOf("\\")
  );
  return withoutQuery.slice(slash + 1);
}

export function articleFileName(path: string) {
  const normalized = path.replaceAll("\\", "/");
  const name = fileName(normalized);
  if (name !== "index.md" && name !== "index.svx") {
    return name;
  }
  const directory = normalized.slice(0, normalized.lastIndexOf("/"));
  return `${fileName(directory)}${name.slice("index".length)}`;
}
