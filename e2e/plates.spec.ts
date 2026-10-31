import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

const rowHeights = (page: import("@playwright/test").Page) =>
  page.locator("#projects a.group").evaluateAll((rows) => rows.map((r) => r.getBoundingClientRect().height));

test("home rows show a plate, and hover swaps in the spec sheet without moving layout", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator("#projects a.group");
  await rows.first().scrollIntoViewIfNeeded();
  await expect(rows.first().locator("span[aria-hidden='true'] > span").first()).toBeVisible();

  const before = await rowHeights(page);
  const spec = rows.first().locator("dl");
  await expect(spec).toHaveCSS("opacity", "0");
  await rows.first().hover();
  await expect(spec).toHaveCSS("opacity", "1");
  await expect(rows.first().locator("p")).toHaveCSS("opacity", "0");
  await expect(spec).toContainText("STACK");
  await expect(spec).toContainText(/MARK\s*slug#[0-9a-f]{4}/);
  expect(await rowHeights(page)).toEqual(before);

  // Keyboard focus shows the same state as hover.
  await page.mouse.move(0, 0);
  await rows.nth(1).focus();
  await expect(rows.nth(1).locator("dl")).toHaveCSS("opacity", "1");
});

test("plate files are served and every /projects caption names the slug hash", async ({ page, request }) => {
  await page.goto("/projects");
  const entries = page.locator("[id] > span[aria-hidden='true'][style*='width']");
  await expect(entries.first()).toBeVisible();
  const slugs = await page.locator("ul > li > div[id]").evaluateAll((els) => els.map((e) => e.id));
  expect(slugs.length).toBeGreaterThan(0);
  for (const slug of slugs) {
    for (const file of [`${slug}.svg`, `${slug}.hover.svg`]) {
      const res = await request.get(`/plates/${file}`);
      expect(res.status(), file).toBe(200);
      expect(await res.text()).toMatch(/^<svg [^>]*viewBox="0 0 16 16"/);
    }
    await expect(page.locator(`[id="${slug}"]`)).toContainText(/slug#[0-9a-f]{4}/);
  }
});
