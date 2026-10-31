import { test, expect, type Page } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } });

const hydrated = (page: Page) =>
  expect(page.locator('astro-island[component-url*="StatusLine"]')).not.toHaveAttribute("ssr", { timeout: 10_000 });

test("the mobile status bar opens a sheet, focus moves in, Esc closes and focus returns", async ({ page }) => {
  await page.route("**/api/github/**", (r) => r.abort());
  await page.goto("/");
  await hydrated(page);
  const bar = page.getByRole("button", { name: "Open status" });
  await expect(bar).toBeVisible();
  await bar.focus();
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog", { name: "Status" });
  await expect(sheet).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement?.closest("dialog") !== null)).toBe(true);

  const heights = await sheet.getByRole("button").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  expect(heights.length).toBeGreaterThanOrEqual(3);
  for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
  expect(await bar.evaluate((e) => e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(bar).toBeFocused();
});

test("the mobile status bar gives way to the blog TOC bar", async ({ page }) => {
  await page.goto("/blog/rag-breaks-earlier-than-people-think/");
  await hydrated(page);
  await expect(page.locator(".mobile-toc-bar")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open status" })).toBeHidden();
});

test("a page without a TOC keeps the status bar", async ({ page }) => {
  await page.goto("/projects/");
  await hydrated(page);
  await expect(page.locator(".mobile-toc-bar")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open status" })).toBeVisible();
});

test("copying a command announces it in one shared live region", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/projects/");
  const cmd = page.locator('[role="button"]:has([data-cmd-text])').first();
  await expect(cmd).toHaveCount(1);
  await expect(cmd.locator("xpath=ancestor::astro-island")).not.toHaveAttribute("ssr", { timeout: 10_000 });
  await cmd.scrollIntoViewIfNeeded();
  await cmd.click();
  await expect(page.locator("#sr-announcer")).toHaveText("Command copied");
  await cmd.click();
  await expect(page.locator("#sr-announcer")).toHaveCount(1);
});
