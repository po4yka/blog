import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

const rowHeights = (page: import("@playwright/test").Page) =>
  page.locator("#projects a.group").evaluateAll((rows) => rows.map((r) => r.getBoundingClientRect().height));

test("home rows show a plate, and hover swaps in the spec sheet and dissolves the plate without moving layout", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator("#projects a.group");
  await rows.first().scrollIntoViewIfNeeded();
  await expect(rows.first().locator("svg.plate-art")).toBeVisible();

  const before = await rowHeights(page);
  const spec = rows.first().locator("dl");
  const late = rows.first().locator(".plate-late").first();
  await expect(spec).toHaveCSS("opacity", "0");
  await expect(late).toHaveCSS("opacity", "0");
  await rows.first().hover();
  await expect(spec).toHaveCSS("opacity", "1");
  await expect(late).toHaveCSS("opacity", "1");
  await expect(rows.first().locator("p")).toHaveCSS("opacity", "0");
  await expect(spec).toContainText("STACK");
  await expect(spec).toContainText(/MARK\s*[a-z]+ · seed [a-z0-9-]+/);
  expect(await rowHeights(page)).toEqual(before);

  // Keyboard focus shows the same state as hover.
  await page.mouse.move(0, 0);
  await rows.nth(1).focus();
  await expect(rows.nth(1).locator("dl")).toHaveCSS("opacity", "1");
  await expect(rows.nth(1).locator(".plate-late").first()).toHaveCSS("opacity", "1");
});

test("every /projects entry has an 8x8 plate and a caption naming both seeds", async ({ page }) => {
  await page.goto("/projects");
  const slugs = await page.locator("ul > li > div[id]").evaluateAll((els) => els.map((e) => e.id));
  expect(slugs.length).toBeGreaterThan(0);
  for (const slug of slugs) {
    const entry = page.locator(`[id="${slug}"]`);
    await expect(entry.locator("svg.plate-art")).toHaveAttribute("viewBox", "0 0 8 8");
    await expect(entry).toContainText(new RegExp(`(backend|tooling|android|web|other) · seed ${slug}`));
  }
  // Keyboard focus inside an entry dissolves its plate too (the row is a div, so :focus-within).
  const linked = page.locator("ul > li > div[id]", { has: page.locator("a") }).first();
  await linked.locator("a").first().focus();
  await expect(linked.locator(".plate-late").first()).toHaveCSS("opacity", "1");
});
