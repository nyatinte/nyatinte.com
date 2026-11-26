import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { varlockVitePlugin } from "@varlock/vite-integration";
import { mdsvex } from "mdsvex";
import type { PreprocessorGroup } from "svelte/compiler";
import type { Plugin } from "vite";
import nkzw from "@nkzw/oxlint-config";
import rsvelteRecommended from "@rsvelte/oxlint-plugin/recommended.json" with { type: "json" };
import { defineConfig } from "vite-plus";
import { transformArticleDirectives } from "./src/lib/log/article-directives";
import { remarkHeadingIds } from "./src/lib/log/remark-heading-ids";
import { logFrontmatterPlugin } from "./src/lib/log/vite-plugin";
import { buildZbSearchIndex } from "./src/lib/search/zb-build";

const pathSeparatorPattern = /[/\\]/;

function zbSearchDevMiddleware(): Plugin {
  return {
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if ((request.url?.split("?")[0] ?? "") !== "/zbsearch/index.zbsb") {
          next();
          return;
        }
        try {
          const { bytes } = buildZbSearchIndex("src/content/log");
          response.setHeader("Content-Type", "application/octet-stream");
          response.setHeader("Cache-Control", "no-store");
          response.end(Buffer.from(bytes));
        } catch (error) {
          next(error);
        }
      });
    },
    name: "zbsearch-dev",
  };
}

function svelteMarkdown(): PreprocessorGroup {
  const processor = mdsvex({
    extensions: [".md", ".svx"],
    highlight: false,
    remarkPlugins: [remarkHeadingIds],
    smartypants: false,
  });
  return {
    async markup(options) {
      const filename = options.filename ?? "";
      const source =
        filename.endsWith(".md") || filename.endsWith(".svx")
          ? transformArticleDirectives(options.content, filename)
          : options.content;
      const result = await processor.markup({
        content: source,
        filename: options.filename,
      });
      if (!result?.code) {
        return result;
      }
      return {
        ...result,
        code: result.code.replaceAll(
          '<script context="module">',
          "<script module>",
        ),
      };
    },
    name: "mdsvex",
  };
}

const rsvelteRules = rsvelteRecommended.rules as Record<
  string,
  "off" | "warn" | "error"
>;

const lint = {
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
    __PREVIEW_EDIT__: "readonly",
    __PREVIEW_PR__: "readonly",
    __PREVIEW_SHA__: "readonly",
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
    "svelte/no-at-debug-tags": "off",
    "svelte/no-at-html-tags": "off",
    "svelte/no-navigation-without-resolve": "off",
    "svelte/no-unnecessary-state-wrap": "off",
    "svelte/require-each-key": "off",
  },
};

export default defineConfig(({ command, mode }) => ({
  check: {
    fmt: true,
    lint: false,
  },
  define: {
    __PREVIEW_EDIT__: JSON.stringify(
      command === "serve" || process.env.PREVIEW_EDIT === "1",
    ),
    __PREVIEW_PR__: JSON.stringify(process.env.PREVIEW_PR ?? ""),
    __PREVIEW_SHA__: JSON.stringify(process.env.PREVIEW_SHA ?? ""),
  },
  fmt: {
    endOfLine: "lf",
    ignorePatterns: [
      ".agents/**",
      ".svelte-kit/**",
      ".wrangler/**",
      "**/*.svelte",
      "AGENTS.md",
      "build/**",
      "dist/**",
      "pnpm-lock.yaml",
      "skills-lock.json",
      "worker-configuration.d.ts",
    ],
    printWidth: 80,
    singleQuote: false,
    sortPackageJson: false,
    svelte: false,
    tabWidth: 2,
    useTabs: false,
  },
  lint,
  plugins:
    mode === "test"
      ? [
          svelte({
            compilerOptions: {
              runes: true,
            },
            configFile: false,
          }),
        ]
      : [
          zbSearchDevMiddleware(),
          logFrontmatterPlugin(),
          varlockVitePlugin(),
          sveltekit({
            adapter: adapter(),
            compilerOptions: {
              runes: ({ filename }) =>
                filename.split(pathSeparatorPattern).includes("node_modules")
                  ? undefined
                  : true,
            },
            csp: {
              directives: {
                "base-uri": ["self"],
                "connect-src": ["self"],
                "default-src": ["self"],
                "font-src": ["self", "data:"],
                "form-action": ["self"],
                "frame-ancestors": ["none"],
                "frame-src": ["self", "https://platform.twitter.com"],
                "img-src": ["self", "https:", "data:"],
                "object-src": ["none"],
                "script-src": ["self", "https://platform.twitter.com"],
                "style-src": ["self"],
                "style-src-attr": ["unsafe-inline"],
              },
              mode: "auto",
            },
            extensions: [".svelte", ".md", ".svx"],
            preprocess: svelteMarkdown(),
          }),
        ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
}));
