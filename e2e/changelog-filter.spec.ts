import { test, expect, type Page } from "@playwright/test";

// The release list is the first ol in main; the architecture diagram's caption list comes after it.
const releases = (page: Page) => page.locator("main ol").first().locator(":scope > li");
const entries = (page: Page) => releases(page).locator("ul > li");

test("the static changelog has every entry, and the filter narrows it by type", async ({ page, request }) => {
  const html = await (await request.get("/changelog/")).text();
  const staticCount = (html.match(/github\.com\/po4yka\/blog\/commit\//g) ?? []).length;
  expect(staticCount).toBeGreaterThan(0);

  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/changelog/");
  await expect(page.locator('astro-island[component-url*="ChangelogIsland"]')).not.toHaveAttribute("ssr", { timeout: 10_000 });
  const group = page.getByRole("group", { name: "Filter by change type" });
  await expect(group.getByRole("button", { name: /^all/ })).toHaveAttribute("aria-pressed", "true");
  const total = await entries(page).count();
  expect(total).toBe(staticCount);

  const fix = group.getByRole("button", { name: /^fix/ });
  const fixCount = Number(await fix.locator("span").innerText());
  await fix.click();
  await expect(fix).toHaveAttribute("aria-pressed", "true");
  await expect(entries(page)).toHaveCount(fixCount);
  const tags = await entries(page).locator(":scope > :first-child").allInnerTexts();
  expect(new Set(tags.map((s) => s.trim().toLowerCase()))).toEqual(new Set(["fix"]));
  await expect(page.locator("p[aria-live]")).toContainText(`${fixCount} / ${total}`);

  // Every release still shown has at least one entry, and the page does not overflow.
  for (const release of await releases(page).all()) {
    expect(await release.locator("ul > li").count()).toBeGreaterThan(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

  await group.getByRole("button", { name: /^all/ }).click();
  await expect(entries(page)).toHaveCount(total);
});
