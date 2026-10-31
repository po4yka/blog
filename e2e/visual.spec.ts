import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

// Screenshot baselines for the redesign. They run only in the CI `visual` job (pinned
// ubuntu-24.04 runner), never on a developer Mac: font rendering differs per OS.

const ROUTES = [
  { name: "home", path: "/" },
  { name: "blog-list", path: "/blog/" },
  { name: "blog-post", path: "/blog/rag-breaks-earlier-than-people-think/" },
  { name: "projects", path: "/projects/" },
  { name: "not-found", path: "/this-page-does-not-exist/" },
];

// Regions whose content changes without a design change: live GitHub data and build metadata.
const dynamicRegions = (page: Page) => [
  page.locator('[data-section-name="git-log"]'),
  page.locator('[data-section-name="open-source"]'),
  page.locator('[data-section-name="activity-calendar"]'),
  page.locator('[data-section-name="hero"] time'),
  page.locator('a[href*="/commit/"]'),
  // The field caption's week count and seed hash.
  page.locator(".hero-field-row [data-decode]"),
  page.locator('[data-section-name="hero"] div.font-mono', {
    has: page.locator("span.label-meta", { hasText: /^activity$/i }),
  }),
];

// client:visible islands hydrate when they enter the viewport, so walk the page once before a full-page shot.
async function revealAll(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState("networkidle");
}

for (const scheme of ["dark", "light"] as const) {
  for (const width of [375, 1280]) {
    test.describe(`${scheme} ${width}px`, () => {
      test.use({
        viewport: { width, height: 900 },
        colorScheme: scheme,
        // Freezes Motion and CSS animations in their final state.
        reducedMotion: "reduce",
      });

      for (const route of ROUTES) {
        test(route.name, async ({ page }) => {
          // Abort live GitHub calls so each panel shows its stable "unavailable" frame
          // (masked anyway) instead of live data.
          await page.route("**/api/github/**", (r) => r.abort());
          await page.goto(route.path);
          await page.waitForLoadState("networkidle");
          await revealAll(page);
          await page.evaluate(() => document.fonts.ready);
          await expect(page).toHaveScreenshot(`${route.name}-${scheme}-${width}.png`, {
            fullPage: true,
            mask: dynamicRegions(page),
            animations: "disabled",
            maxDiffPixelRatio: 0.01,
            stylePath: path.join(import.meta.dirname, "visual.css"),
            // Full-page shots of long posts need more than the default 5 s to capture twice.
            timeout: 20_000,
          });
        });
      }
    });
  }
}
