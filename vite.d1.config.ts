import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vite-plus";

export default defineConfig(async () => {
  const migrations = await readD1Migrations(
    path.join(import.meta.dirname, "drizzle")
  );

  return {
    plugins: [
      cloudflareTest({
        miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
        wrangler: { configPath: "./wrangler.test.jsonc" },
      }),
    ],
    test: {
      include: ["tests/d1/**/*.test.ts"],
      setupFiles: ["./tests/d1/apply-migrations.ts"],
    },
  };
});
