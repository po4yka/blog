import { test, expect } from "@playwright/test";

test("the architecture diagram is static HTML in both languages, under 4 KB", async ({ request }) => {
  const html = await (await request.get("/changelog/")).text();
  const svg = html.match(/<svg viewBox="0 0 640 264"[\s\S]*?<\/svg>/)?.[0] ?? "";
  expect(svg).toContain("caches.default");
  expect(svg).toContain("env.DB");
  expect(Buffer.byteLength(svg)).toBeLessThan(4096);
  expect(html).toContain("How this site runs");
  expect(html).toContain("Как работает сайт");
});

for (const width of [375, 1280]) {
  test(`at ${width}px every flow is drawn once the diagram is in view, with no page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/changelog/");
    const figure = page.locator("figure.arch");
    await figure.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 300));
    await expect.poll(() => figure.locator("path.arch-flow").evaluateAll((ps) => ps.map((p) => getComputedStyle(p).strokeDashoffset))).toEqual(["0px", "0px", "0px"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

test("under reduced motion the flows are drawn at once, before any scroll", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/changelog/");
  const offsets = await page.locator("path.arch-flow").evaluateAll((ps) => ps.map((p) => getComputedStyle(p).strokeDasharray));
  expect(offsets).toEqual(["none", "none", "none"]);
});
