import type { Component } from "svelte";
import { articleFileName } from "./file-name";

const extensionPattern = /\.(md|svx)$/u;

interface ArticleModule {
  default: Component;
}

const modules = import.meta.glob<ArticleModule>(
  "../../content/log/*/index.{md,svx}",
  { eager: true }
);

const components = new Map(
  Object.entries(modules).map(([path, module]) => [
    articleFileName(path).replace(extensionPattern, ""),
    module.default,
  ])
);

export function articleComponent(slug: string) {
  return components.get(slug);
}
