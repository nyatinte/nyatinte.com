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
            adapter: adapter({
              config: "./wrangler.varlock.jsonc",
              platformProxy: { configPath: "./wrangler.local.jsonc" },
            }),
            compilerOptions: {
              runes: ({ filename }) =>
                filename.split(pathSeparatorPattern).includes("node_modules")
                  ? undefined
                  : true,
            },
          }),
        ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "poc/**/*.test.ts"],
  },
}));
