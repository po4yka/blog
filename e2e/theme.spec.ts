import { test, expect } from "@playwright/test";

const STORAGE_KEY = "site_preferences";

test.describe("Theme switching and persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Clear stored preferences so each test starts fresh
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
    await page.reload();
    await page.waitForLoadState("networkidle");
    // Wait for the Settings island to hydrate
    await page.getByRole("button", { name: "light", exact: true }).waitFor({ state: "visible" });
  });

  test("settings page loads with theme options", async ({ page }) => {
    // The settings island renders three theme buttons: dark, light, system
    await expect(page.getByRole("button", { name: "dark", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "light", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "system", exact: true })).toBeVisible();
  });

  test("switch to light theme updates html class", async ({ page }) => {
    await page.getByRole("button", { name: "light", exact: true }).click();

    // The store applies classes to <html>: "light" added, "dark" removed
    await expect(page.locator("html")).toHaveClass(/\blight\b/);
    // "dark" class should not be present
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).not.toMatch(/\bdark\b/);
  });

  test("switch to dark theme updates html class", async ({ page }) => {
    // First switch to light so we can verify switching back
    await page.getByRole("button", { name: "light", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/\blight\b/);

    // Now switch to dark
    await page.getByRole("button", { name: "dark", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).not.toMatch(/\blight\b/);
  });

  test("theme persists across page reload via localStorage", async ({ page }) => {
    // Set light theme
    await page.getByRole("button", { name: "light", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/\blight\b/);

    // Verify localStorage was updated
    const stored = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, STORAGE_KEY);
    expect(stored?.state?.theme).toBe("light");

    // Reload and check persistence
    await page.reload();
    await page.waitForSelector("button", { state: "attached" });
    await expect(page.locator("html")).toHaveClass(/\blight\b/);
  });

  test("theme set on settings page applies globally on other pages", async ({ page }) => {
    // Set light theme on settings page
    await page.getByRole("button", { name: "light", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/\blight\b/);

    // Navigate to blog and verify theme carried over
    await page.goto("/blog");
    await expect(page.locator("html")).toHaveClass(/\blight\b/);
  });
});
