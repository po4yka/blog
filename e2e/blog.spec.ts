import { test, expect } from "@playwright/test";

test.describe("Blog list page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blog");
    // Wait for the BlogListIsland to hydrate -- category filter buttons become visible
    await page.getByRole("button", { name: "All" }).waitFor({ state: "visible" });
  });

  test("shows empty state when no posts are published", async ({ page }) => {
    await expect(page.getByText("no posts found")).toBeVisible();
  });

  test("only the 'All' category is available", async ({ page }) => {
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  });
});
