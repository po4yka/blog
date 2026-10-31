import { test, expect } from "@playwright/test";

for (const [path, lang, slug] of [
  ["/blog/rag-breaks-earlier-than-people-think/", "en", "rag-breaks-earlier-than-people-think"],
  ["/blog/ru/network-isnt-broken-just-here/", "ru", "network-isnt-broken-just-here"],
] as const) {
  test(`${lang} post: the static header has the cover and a caption naming its inputs`, async ({ request }) => {
    const html = await (await request.get(path)).text();
    // The cover sits inside the header, after the h1 and its time.
    expect(html).toMatch(/<article[\s\S]*?<header[\s\S]*?<h1[\s\S]*?<time[\s\S]*?<figure[\s\S]*?<\/header>/);
    expect(html).toContain(`/covers/${lang}-${slug}.svg`);
    expect(html).toMatch(new RegExp(`${slug}, \\d+ \\S+, \\d+ \\S+, \\d{4}-\\d{2}-\\d{2}`));

    const cover = await request.get(`/covers/${lang}-${slug}.svg`);
    expect(cover.status()).toBe(200);
    expect(await cover.text()).toMatch(/^<svg [^>]*viewBox="0 0 144 24"/);
    const og = await request.get(`/og/${lang}-${slug}.png`);
    expect(og.status()).toBe(200);
    expect(og.headers()["content-type"]).toContain("image/png");
  });
}

test("the cover has a stable size and is hidden from assistive tech", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/blog/rag-breaks-earlier-than-people-think/");
  const art = page.locator("article header figure > div[aria-hidden='true']");
  await expect(art).toBeVisible();
  const box = (await art.boundingBox())!;
  expect(box.width / box.height).toBeCloseTo(144 / 24, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
