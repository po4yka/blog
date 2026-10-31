import { test, expect, type Page } from "@playwright/test";

const storeLocale = (page: Page, locale: "en" | "ru") =>
  page.addInitScript((l) => localStorage.setItem("site_preferences", JSON.stringify({ state: { locale: l }, version: 3 })), locale);

test("privacy reads in Russian from the first paint, with no English policy text showing", async ({ page }) => {
  await storeLocale(page, "ru");
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Конфиденциальность", { useInnerText: true });
  const viewer = page.locator("main");
  await expect(viewer.getByRole("heading", { name: "Аналитика" })).toBeVisible();
  await expect(viewer.getByRole("heading", { name: "Analytics" })).toBeHidden();
  const text = await viewer.innerText();
  expect(text).not.toContain("Third-party trackers");
  expect(text).toContain("analytics.po4yka.dev");
});

test("privacy static HTML carries both languages for crawlers", async ({ request }) => {
  const html = await (await request.get("/privacy/")).text();
  expect(html).toContain("Third-party trackers and advertising");
  expect(html).toContain("Сторонние трекеры и реклама");
});

test.describe("settings at 375px", () => {
  test.use({ viewport: { width: 375, height: 900 } });

  test("every toggle is at least 44px square, and values are localised", async ({ page }) => {
    await storeLocale(page, "ru");
    await page.goto("/settings/");
    await expect(page.locator('astro-island[component-url*="SettingsIsland"]')).not.toHaveAttribute("ssr", { timeout: 10_000 });
    const buttons = page.locator("main [role=group] button");
    expect(await buttons.count()).toBeGreaterThan(10);
    for (const box of await buttons.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()))) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    const body = await page.locator("main").innerText();
    // Raw store values (compact/default/large, light/dark inside the system label) never show in Russian.
    expect(body).not.toMatch(/\((light|dark)\)/);
    expect(body).not.toMatch(/^(compact|default|large)$/m);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  });

  test("reset keeps its label and announces the result in a status line", async ({ page }) => {
    await page.goto("/settings/");
    await expect(page.locator('astro-island[component-url*="SettingsIsland"]')).not.toHaveAttribute("ssr", { timeout: 10_000 });
    const reset = page.getByRole("button", { name: "$ reset --defaults" });
    const box = (await reset.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    await reset.click();
    await expect(reset).toHaveText("$ reset --defaults");
    await expect(page.getByRole("status")).toHaveText(/restored/i);
  });
});
