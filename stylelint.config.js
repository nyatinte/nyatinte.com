/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [
    ".agents/**",
    ".svelte-kit/**",
    ".wrangler/**",
    "node_modules/**",
    "build/**",
    "dist/**",
  ],
  overrides: [
    {
      customSyntax: "postcss-html",
      files: ["**/*.svelte"],
      rules: {
        "selector-pseudo-class-no-unknown": [
          true,
          { ignorePseudoClasses: ["global"] },
        ],
      },
    },
  ],
  rules: {
    "at-rule-empty-line-before": null,
    "declaration-empty-line-before": null,
    "rule-empty-line-before": null,
  },
};
