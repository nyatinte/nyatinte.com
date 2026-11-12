import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { articlesFromSources } from "./frontmatter";

export function loadArticlesFromDirectory(directory: string) {
  let names: string[];
  try {
    names = readdirSync(directory);
  } catch (cause) {
    throw new Error(`Article directory is missing: ${directory}`, { cause });
  }
  const sources: Record<string, string> = {};
  for (const name of names) {
    if (!(name.endsWith(".md") || name.endsWith(".svx"))) {
      continue;
    }
    sources[name] = readFileSync(join(directory, name), "utf8");
  }
  return articlesFromSources(sources);
}
