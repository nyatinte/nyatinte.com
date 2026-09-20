import adapter from "@sveltejs/adapter-cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import { defineConfig } from "vite-plus";

export default defineConfig(({ mode }) => ({
  plugins:
    mode === "test"
      ? []
      : [
          varlockVitePlugin(),
          tailwindcss(),
          sveltekit({
            compilerOptions: {
              runes: ({ filename }) =>
                filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
            },
            adapter: adapter(),
          }),
        ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  fmt: {
    ignorePatterns: [".agents/**", "plan-docs/**", "AGENTS.md", "README.md", "skills-lock.json"],
    svelte: true,
  },
  lint: {
    ignorePatterns: [".agents/**", "plan-docs/**", "AGENTS.md", "README.md"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  staged: {
    "*.{js,ts,tsx,vue,svelte}": "vp check --fix",
  },
}));
