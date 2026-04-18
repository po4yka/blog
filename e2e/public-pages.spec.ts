import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("homepage renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Nikita Pochaev/);
    // Nav is visible
    await expect(page.locator("nav")).toBeVisible();
    // Hero content
    await expect(page.getByText("Nikita Pochaev", { exact: true }).first()).toBeVisible();
    // Key homepage sections exist (rendered via React islands)
    await expect(page.locator('[data-section-name="hero"]')).toBeVisible();
    await expect(page.locator('[data-section-name="projects"]')).toBeAttached();
    await expect(page.locator('[data-section-name="experience"]')).toBeAttached();
    await expect(page.locator('[data-section-name="blog"]')).toBeAttached();
  });

  test("blog list page renders", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveTitle(/Blog — Nikita Pochaev/);
    await expect(page.locator("nav")).toBeVisible();
    // Blog list island should hydrate and show content (posts or empty state)
    await page.getByRole("button", { name: "All" }).waitFor({ state: "visible" });
  });

  test("projects page renders", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveTitle(/Projects — Nikita Pochaev/);
    await expect(page.locator("nav")).toBeVisible();
    // Projects from projectsData.ts
    await expect(
      page.getByRole("heading", { name: "Copilot AI Platform" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "AGENTS.md Framework" })
    ).toBeVisible();
  });

  test("experience page renders", async ({ page }) => {
    await page.goto("/experience");
    await expect(page).toHaveTitle(/Experience — Nikita Pochaev/);
    await expect(page.locator("nav")).toBeVisible();
    // Roles from experienceData.ts
    await expect(page.getByText("AI Engineer").first()).toBeVisible();
    await expect(
      page.getByText("Senior Android Developer").first()
    ).toBeVisible();
  });

  test("settings page renders", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveTitle(/Settings — Nikita Pochaev/);
    await expect(page.locator("nav")).toBeVisible();
    // Settings island hydrates and exposes theme controls
    await expect(page.getByRole("button", { name: "light", exact: true })).toBeVisible();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(/404 — Nikita Pochaev/);
    await expect(page.getByText("Page not found")).toBeVisible();
    // Home recovery link should be present
    const homeLink = page.getByRole("link", { name: "Go home" });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("href", "/");
  });
});
