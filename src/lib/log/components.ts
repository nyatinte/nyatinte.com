import type { Component } from "svelte";
import { fileName } from "./frontmatter";

const extensionPattern = /\.(md|svx)$/u;

interface ArticleModule {
  default: Component;
}

const modules = import.meta.glob<ArticleModule>(
  "../../content/log/*.{md,svx}",
  { eager: true }
);

const components = new Map(
  Object.entries(modules).map(([path, module]) => [
    fileName(path).replace(extensionPattern, ""),
    module.default,
  ])
);

export function articleComponent(slug: string) {
  return components.get(slug);
}
