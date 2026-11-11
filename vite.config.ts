import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import { defineConfig } from "vite-plus";

const pathSeparatorPattern = /[/\\]/;

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
          }),
        ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "poc/**/*.test.ts"],
  },
}));
