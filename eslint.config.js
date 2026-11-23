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
      "no-inline-comments": "error",
      "no-warning-comments": [
        "error",
        { location: "anywhere", terms: ["TODO", "FIXME", "XXX"] },
      ],
      "svelte/no-at-debug-tags": "off",
      "svelte/no-at-html-tags": "off",
      "svelte/no-unnecessary-state-wrap": "off",
      "svelte/require-each-key": "off",
    },
  },
  {
    files: ["src/**/*.{ts,js}", "scripts/**/*.{ts,mjs}"],
    ignores: ["**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "no-inline-comments": "error",
      "no-warning-comments": [
        "error",
        { location: "anywhere", terms: ["TODO", "FIXME", "XXX"] },
      ],
    },
  },
];
