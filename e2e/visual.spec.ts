import { expect, test } from "@playwright/test";

test.describe("Visual Regression", () => {
  test("home page", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  });

  test("about page", async ({ page }) => {
    await page.goto("/about");
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("about.png", { fullPage: true });
  });

  test("blog list page", async ({ page }) => {
    await page.goto("/blog");
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("blog-list.png", { fullPage: true });
  });
});
