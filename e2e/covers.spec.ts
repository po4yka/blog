import { test, expect } from "@playwright/test";

for (const [path, lang] of [
  ["/blog/rag-breaks-earlier-than-people-think/", "en"],
  ["/blog/ru/network-isnt-broken-just-here/", "ru"],
] as const) {
  test(`${lang} post: the static header has the cover, its section numbers and a caption naming what it draws`, async ({ page, request }) => {
    const html = await (await request.get(path)).text();
    // The cover sits inside the header, after the h1 and its time, as an inline SVG.
    expect(html).toMatch(/<article[\s\S]*?<header[\s\S]*?<h1[\s\S]*?<time[\s\S]*?<figure[\s\S]*?<svg[^>]*viewBox="0 0 184 20"[\s\S]*?<\/header>/);
    expect(html).toMatch(/cover-header/);
    expect(html).toMatch(/\d+ \S+, \d+ \S+/);

    // Every section number links to a heading that exists.
    await page.goto(path);
    const numbers = page.locator(".post-cover nav a");
    expect(await numbers.count()).toBeGreaterThan(0);
    for (const href of await numbers.evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) {
      await expect(page.locator(`[id="${decodeURIComponent(href.slice(1))}"]`)).toHaveCount(1);
    }

    const og = await request.get(`/og/${lang}-${path.split("/").filter(Boolean).at(-1)}.png`);
    expect(og.status()).toBe(200);
    expect(og.headers()["content-type"]).toContain("image/png");
  });
}

test("the cover has a stable size and is hidden from assistive tech", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/blog/rag-breaks-earlier-than-people-think/");
  const art = page.locator("article header figure svg.cover-header[aria-hidden='true']");
  await expect(art).toBeVisible();
  const box = (await art.boundingBox())!;
  expect(box.width / box.height).toBeCloseTo(184 / 20, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test("under reduced motion the cover is printed at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/blog/network-isnt-broken-just-here/");
  const pixels = page.locator(".cover-header .cover-px");
  await expect(pixels.first()).toHaveCSS("opacity", "1");
  await expect(pixels.last()).toHaveCSS("opacity", "1");
});

test("pointing at a section dims the others and names it in the caption", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog/network-isnt-broken-just-here/");
  // The island hydrates on idle; the numbers gain data-decode only after it mounts, so wait for that before hovering.
  await expect(page.locator(".post-cover nav a span[data-decode]").first()).toBeAttached();
  const second = page.locator(".post-cover nav a").nth(1);
  await second.hover();
  await expect(page.locator(".cover-header .cover-block[data-dim]").first()).toBeAttached();
  await expect(page.locator(".post-cover figcaption")).toContainText(/§02 /);
});

test("the cover follows reading progress", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog/network-isnt-broken-just-here/");
  await page.locator(".cover-map").waitFor();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
  await expect.poll(async () => Number(await page.locator("aside").evaluate((el) => el.style.getPropertyValue("--read") || "0"))).toBeGreaterThan(0.2);
  await expect(page.locator("aside")).toHaveCSS("--unread", "0.35");
});

test("blog list rows carry the cover strip, which dissolves to full density on hover and shares the post cover's transition name", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/blog");
  const row = page.locator("a.group", { has: page.locator(".cover-strip") }).first();
  const strip = row.locator(".cover-strip");
  await expect(strip).toBeVisible();
  const late = strip.locator(".cover-px[data-late]").first();
  await expect(late).toHaveCSS("opacity", "0");
  await row.hover();
  await expect(late).toHaveCSS("opacity", "1");

  const name = await strip.evaluate((el) => getComputedStyle(el).viewTransitionName);
  expect(name).toMatch(/^post-cover-/);
  await row.click();
  await expect(page.locator(".cover-header")).toHaveCSS("view-transition-name", name);
});
