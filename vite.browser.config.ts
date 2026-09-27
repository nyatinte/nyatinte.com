import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: "chromium" }],
      provider: playwright(),
    },
    include: ["tests/browser/**/*.browser.test.ts"],
  },
});
