import nkzw from "@nkzw/oxlint-config";
import rsvelteRecommended from "@rsvelte/oxlint-plugin/recommended.json" with { type: "json" };
import { defineConfig } from "oxlint";

const rsvelteRules = rsvelteRecommended.rules as Record<
  string,
  "off" | "warn" | "error"
>;

export default defineConfig({
  env: { browser: true, builtin: true, es2024: true, node: true },
  extends: [nkzw],
  globals: {
    $bindable: "readonly",
    $derived: "readonly",
    $effect: "readonly",
    $host: "readonly",
    $inspect: "readonly",
    $props: "readonly",
    $state: "readonly",
  },
  ignorePatterns: [
    ".agents/**",
    "AGENTS.md",
    "README.md",
    "skills-lock.json",
    "worker-configuration.d.ts",
    "**/*.d.ts",
  ],
  jsPlugins: ["@rsvelte/oxlint-plugin"],
  overrides: [
    {
      files: ["**/*.test.ts"],
      rules: { "quality/no-known-value-widening": "off" },
    },
    {
      files: ["scripts/**"],
      rules: { "no-console": "off" },
    },
  ],
  rules: {
    ...rsvelteRules,
    "no-inline-comments": "error",
    "no-warning-comments": [
      "error",
      { location: "anywhere", terms: ["TODO", "FIXME", "XXX"] },
    ],
    "@nkzw/no-instanceof": "off",
    "quality/no-unsafe-dictionary-type": "off",
    "svelte/no-at-debug-tags": "off",
    "svelte/no-at-html-tags": "off",
    "svelte/no-navigation-without-resolve": "off",
    "svelte/no-unnecessary-state-wrap": "off",
    "svelte/require-each-key": "off",
  },
});
