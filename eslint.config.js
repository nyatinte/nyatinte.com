import tsParser from "@typescript-eslint/parser";
import svelte from "eslint-plugin-svelte";

export default [
  ...svelte.configs.recommended,
  {
    files: ["src/**/*.svelte", "src/**/*.svelte.ts", "src/**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        svelteFeatures: { runes: true },
      },
    },
    rules: {
      "svelte/no-at-debug-tags": "off",
      "svelte/no-at-html-tags": "off",
      "svelte/no-unnecessary-state-wrap": "off",
      "svelte/require-each-key": "off",
    },
  },
];
