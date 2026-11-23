import { join } from "node:path";
import type { Plugin } from "vite";
import { loadArticlesFromDirectory } from "./directory";

export function logFrontmatterPlugin(): Plugin {
  let root = process.cwd();
  return {
    buildStart() {
      try {
        loadArticlesFromDirectory(join(root, "src/content/log"));
      } catch (error) {
        this.error(
          error instanceof Error
            ? error.message
            : "Invalid article frontmatter",
        );
      }
    },
    configResolved(config) {
      ({ root } = config);
    },
    name: "nyatinte-log-frontmatter",
  };
}
