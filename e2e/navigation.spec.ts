import { test, expect } from "@playwright/test";

test.describe("navigation", () => {
  test("nav links navigate to correct pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();

    // Click "blog" nav link and verify navigation
    await page.locator("nav").getByRole("link", { name: "blog" }).click();
    await expect(page).toHaveURL(/\/blog\/?$/);
    await expect(page).toHaveTitle(/Blog — Nikita Pochaev/);

    // Click "projects" nav link
    await page.locator("nav").getByRole("link", { name: "projects" }).click();
    await expect(page).toHaveURL(/\/projects\/?$/);
    await expect(page).toHaveTitle(/Projects — Nikita Pochaev/);

    // Click "experience" nav link
    await page
      .locator("nav")
      .getByRole("link", { name: "experience" })
      .click();
    await expect(page).toHaveURL(/\/experience\/?$/);
    await expect(page).toHaveTitle(/Experience — Nikita Pochaev/);

    // Click "settings" nav link
    await page.locator("nav").getByRole("link", { name: "settings" }).click();
    await expect(page).toHaveURL(/\/settings\/?$/);
    await expect(page).toHaveTitle(/Settings — Nikita Pochaev/);

    // Click "home" nav link to return
    await page.locator("nav").getByRole("link", { name: "home" }).click();
    await expect(page).toHaveURL("/");
    await expect(page).toHaveTitle(/Nikita Pochaev/);
  });

  test("nav is present on all pages", async ({ page }) => {
    const routes = ["/", "/blog", "/projects", "/experience", "/settings"];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("nav")).toBeVisible();
      // Logo/home link with "po4yka" text is in the nav
      await expect(
        page.locator("nav").getByRole("link", { name: /po4yka/ })
      ).toBeVisible();
    }
  });

  test("browser back button works after navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Nikita Pochaev/);

    // Navigate to blog
    await page.locator("nav").getByRole("link", { name: "blog" }).click();
    await expect(page).toHaveURL(/\/blog\/?$/);

    // Navigate to projects
    await page.locator("nav").getByRole("link", { name: "projects" }).click();
    await expect(page).toHaveURL(/\/projects\/?$/);

    // Go back to blog list
    await page.goBack();
    await expect(page).toHaveURL(/\/blog\/?$/);

    // Go back to homepage
    await page.goBack();
    await expect(page).toHaveURL("/");
  });
});
