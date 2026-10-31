import { test, expect } from "@playwright/test";

for (const [width, locale] of [[375, "ru"], [1280, "en"]] as const) {
  test(`experience timeline at ${width}px (${locale}): one node per role on one rail, no overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((l) => localStorage.setItem("site_preferences", JSON.stringify({ state: { locale: l }, version: 3 })), locale);
    await page.goto("/experience/");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);

    const roles = page.locator("main ol > li");
    const count = await roles.count();
    expect(count).toBeGreaterThan(3);
    const rail = (await page.locator("main ol").locator("xpath=preceding-sibling::span[1]").boundingBox())!;
    const railX = rail.x + rail.width / 2;
    for (let i = 0; i < count; i++) {
      const node = (await roles.nth(i).locator(":scope > div > span[aria-hidden='true']").first().boundingBox())!;
      expect(Math.abs(node.x + node.width / 2 - railX)).toBeLessThan(1);
    }
    // A role that is still running has a filled node; a past one is hollow.
    await expect(roles.first().locator("span[aria-hidden='true']").first()).toHaveClass(/bg-foreground/);
    await expect(roles.last().locator("span[aria-hidden='true']").first()).toHaveClass(/bg-background/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}
