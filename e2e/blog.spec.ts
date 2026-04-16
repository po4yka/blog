import { test, expect } from "@playwright/test";

test.describe("Blog list page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blog");
    // Wait for the BlogListIsland to hydrate -- category filter buttons become visible
    await page.getByRole("button", { name: "All" }).waitFor({ state: "visible" });
  });

  test("shows blog posts when published", async ({ page }) => {
    // At least one post should be visible
    await expect(page.locator("a[href*='/blog/']").first()).toBeVisible();
  });

  test("category filter buttons are available", async ({ page }) => {
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  });
});
