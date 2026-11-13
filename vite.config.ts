import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import { mdsvex } from "mdsvex";
import type { PreprocessorGroup } from "svelte/compiler";
import { defineConfig } from "vite-plus";
import { remarkHeadingIds } from "./src/lib/log/remark-heading-ids";
import { logFrontmatterPlugin } from "./src/lib/log/vite-plugin";

const pathSeparatorPattern = /[/\\]/;

function svelteMarkdown(): PreprocessorGroup {
  const processor = mdsvex({
    extensions: [".md", ".svx"],
    highlight: false,
    remarkPlugins: [remarkHeadingIds],
    smartypants: false,
  });
  return {
    async markup(options) {
      const result = await processor.markup({
        content: options.content,
        filename: options.filename,
      });
      if (!result?.code) {
        return result;
      }
      return {
        ...result,
        code: result.code.replaceAll(
          '<script context="module">',
          "<script module>"
        ),
      };
    },
    name: "mdsvex",
  };
}

export default defineConfig(({ mode }) => ({
  check: {
    fmt: false,
    lint: false,
  },
  lint: {
    ignorePatterns: [
      ".agents/**",
      "AGENTS.md",
      "README.md",
      "skills-lock.json",
    ],
    options: { typeAware: true, typeCheck: true },
  },
  plugins:
    mode === "test"
      ? []
      : [
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
                "img-src": ["self", "https:", "data:"],
                "object-src": ["none"],
                "script-src": ["self"],
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
