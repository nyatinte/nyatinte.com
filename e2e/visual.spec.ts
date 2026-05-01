import { expect, test } from "@playwright/test";

test.describe("Visual Regression", () => {
  test("home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("home.png", { fullPage: true });
  });

  test("about page", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveScreenshot("about.png", { fullPage: true });
  });

  test("blog list page", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveScreenshot("blog-list.png", { fullPage: true });
  });
});
