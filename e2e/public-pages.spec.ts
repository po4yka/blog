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
    // The blog list island should render with post titles from content collection
    await expect(
      page.getByText("KMP: Shared Logic Without Shared UI")
    ).toBeVisible();
    await expect(
      page.getByText("Mobile CI That Actually Works")
    ).toBeVisible();
  });

  test("blog post page renders", async ({ page }) => {
    await page.goto("/blog/kmp-shared-logic-without-shared-ui");
    await expect(page).toHaveTitle(
      /KMP: Shared Logic Without Shared UI — Nikita Pochaev/
    );
    await expect(page.locator("nav")).toBeVisible();
    // Post content should be visible
    await expect(
      page.getByText("KMP: Shared Logic Without Shared UI")
    ).toBeVisible();
    // Tags from the post metadata
    await expect(page.getByText("Architecture", { exact: true })).toBeVisible();
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
    // Settings island shows theme controls
    await expect(page.getByText("preferences.conf", { exact: true })).toBeVisible();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(/404 — Nikita Pochaev/);
    await expect(page.getByText("Page not found")).toBeVisible();
    // "Go home" link should be present
    await expect(page.getByTitle("Go home")).toBeVisible();
  });
});
