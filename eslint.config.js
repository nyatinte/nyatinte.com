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
      "svelte/button-has-type": "error",
    },
  },
];
