import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";

const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/u;
const importPattern = /^\s*import\s+(?:[^"'`]*?\s+from\s+)?["']([^"']+)["']/mu;

const layoutSource = readFileSync(
  new URL("./+layout.svelte", import.meta.url),
  "utf8",
);

test("theme-transition.css が最初の import である", () => {
  const scriptBody = layoutSource.match(scriptPattern)?.[1];
  expect(scriptBody).toBeDefined();
  const firstImport = scriptBody?.match(importPattern)?.[1];
  expect(firstImport).toBe("../lib/styles/theme-transition.css");
});
