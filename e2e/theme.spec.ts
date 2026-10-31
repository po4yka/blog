import { test, expect, type Page } from "@playwright/test";
import { installVtRecorder, readVt, readVtCalls, supportsVt } from "./helpers/viewTransitions";

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

test.describe("Reduced motion", () => {
  // <body> carries the theme fade (--dur-base, 240ms), so it shows whether transitions are cut.
  const bodyTransition = (page: import("@playwright/test").Page) =>
    page.evaluate(() => parseFloat(getComputedStyle(document.body).transitionDuration));

  test("stored Settings flag sets data-motion before paint and cuts transitions", async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({ state: { reduceMotion: true }, version: 4 }));
    }, STORAGE_KEY);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
    expect(await bodyTransition(page)).toBeLessThan(0.001);

    // Survives a client-side navigation, which resets <html> attributes.
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "blog" }).click();
    await page.waitForURL(/\/blog/);
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  });

  test.describe("OS setting", () => {
    test.use({ reducedMotion: "reduce" });

    test("sets data-motion with no stored preference", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
      expect(await bodyTransition(page)).toBeLessThan(0.001);
    });
  });

  test("full motion keeps the theme fade", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-motion");
    expect(await bodyTransition(page)).toBeCloseTo(0.24, 3);
  });
});

test.describe("Theme wipe", () => {
  const POST = "/blog/rag-breaks-earlier-than-people-think/";
  const toggle = (page: Page) => page.locator("[data-theme-toggle]:visible").first();
  const dark = (page: Page) => expect(page.locator("html")).toHaveClass(/\bdark\b/);

  test.beforeEach(async ({ page }) => {
    await installVtRecorder(page);
  });

  // A click before the client:idle Nav island hydrates does nothing, so wait for it.
  const open = async (page: Page, path: string) => {
    await page.goto(path);
    await page.locator('astro-island[component-url*="Nav"]:not([ssr])').first().waitFor({ state: "attached" });
  };

  test("the nav toggle wipes from the control and cleans up", async ({ page }) => {
    await open(page, "/");
    await toggle(page).click();
    await dark(page);
    if (!(await supportsVt(page))) {
      // Fallback: the theme changed with no transition.
      expect(await readVtCalls(page)).toBe(0);
      return;
    }
    await expect.poll(async () => (await readVt(page)).length).toBeGreaterThan(0);
    const wipe = (await readVt(page)).find((a) => a.pseudo === "::view-transition-new(root)" && a.name === "theme-wipe");
    expect(wipe).toBeDefined();
    expect(Number(wipe?.duration) + (wipe?.delay ?? 0)).toBeLessThanOrEqual(300);
    await expect(page.locator("html")).not.toHaveAttribute("data-theme-wipe");
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--wipe-x"))).toBe("");
  });

  test("a second toggle during a wipe applies at once and leaves no wipe state", async ({ page }) => {
    await open(page, "/");
    // Two clicks in one task, so the second lands while the first 240 ms wipe still runs.
    await toggle(page).evaluate((el: HTMLElement) => {
      el.click();
      el.click();
    });
    // system -> dark -> light: the second change must not be lost.
    await expect(page.locator("html")).toHaveClass(/\blight\b/);
    await expect(page.locator("html")).not.toHaveAttribute("data-theme-wipe");
    if (await supportsVt(page)) expect(await readVtCalls(page)).toBe(1);
  });

  test("a post page wipes as one root snapshot, with no named groups", async ({ page }) => {
    await open(page, POST);
    const h1 = page.locator("article > header > h1");
    await expect(h1).toBeVisible();
    // Positive control: the title carries a name that the wipe must suppress.
    expect(await h1.evaluate((el) => getComputedStyle(el).viewTransitionName)).not.toBe("none");
    await toggle(page).click();
    await dark(page);
    if (!(await supportsVt(page))) return;
    await expect.poll(async () => (await readVt(page)).length).toBeGreaterThan(0);
    const groups = (await readVt(page)).map((a) => a.pseudo).filter((p) => p.startsWith("::view-transition-group("));
    expect(groups.filter((p) => p !== "::view-transition-group(root)")).toEqual([]);
  });

  test("stored reduced-motion flag changes the theme without a transition", async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({ state: { reduceMotion: true }, version: 4 }));
    }, STORAGE_KEY);
    await open(page, "/");
    await toggle(page).click();
    await dark(page);
    expect(await readVtCalls(page)).toBe(0);
  });

  test.describe("OS reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("changes the theme without a transition", async ({ page }) => {
      await open(page, "/");
      await toggle(page).click();
      await dark(page);
      expect(await readVtCalls(page)).toBe(0);
    });
  });
});
