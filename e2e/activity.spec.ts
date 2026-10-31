import { test, expect, type Page } from "@playwright/test";

const day = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

async function mockGitHub(page: Page) {
  await page.route("**/api/github/calendar", (r) =>
    r.fulfill({ json: [day(0), day(0), day(0), day(1), day(9)].map((created_at) => ({ created_at })) }),
  );
  await page.route("**/api/github/events", (r) =>
    r.fulfill({ json: { buckets: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 3], total: 5, latest: day(0) } }),
  );
}

test.describe("activity heatmap", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("every day is reachable by keyboard, with a readout and a hidden table", async ({ page }) => {
    await mockGitHub(page);
    await page.goto("/");
    const section = page.locator('[data-section-name="activity-calendar"]');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toContainText("public GitHub events");
    await expect(section).toContainText("5 EVENTS · 3/");

    const grid = section.getByRole("group", { name: /Activity calendar/ });
    await grid.focus();
    const readout = section.locator("p[aria-live]");
    await expect(readout).toHaveText(/^[A-Z]{3} \d+ · 3 EVENTS$/);
    await page.keyboard.press("ArrowUp");
    await expect(readout).toHaveText(/ · 1 EVENT$/);
    await page.keyboard.press("Home");
    await expect(readout).toHaveText(/ · 0 EVENTS$/);

    const table = section.locator(".sr-only table");
    await expect(table.locator("tbody tr")).toHaveCount(13);
    await expect(table.locator("caption")).toContainText("Public GitHub events");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  });

  test("a failed fetch keeps the frame height and says the data is unavailable", async ({ page }) => {
    await page.route("**/api/github/**", (r) => r.abort());
    await page.goto("/");
    const section = page.locator('[data-section-name="activity-calendar"]');
    await section.scrollIntoViewIfNeeded();
    const svg = section.locator("svg").first();
    const before = (await svg.boundingBox())!.height;
    await expect(section).toContainText("ACTIVITY UNAVAILABLE");
    expect((await svg.boundingBox())!.height).toBe(before);
    expect(before).toBeGreaterThan(100);
  });
});

test("hero sparkline draws a path, labels today, and reads days by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockGitHub(page);
  await page.goto("/");
  const panel = page.locator("section[aria-labelledby='hero-heading']").getByRole("group", { name: /Public GitHub events/ });
  await expect(panel.locator("path")).toHaveCount(1);
  await expect(page.locator("section[aria-labelledby='hero-heading']")).toContainText("TODAY 3");
  await panel.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(panel.locator("xpath=preceding-sibling::p[1]")).toHaveText(/ · 1 EVENT$/);
});
