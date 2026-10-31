import { test, expect, type Page } from "@playwright/test";

const POST = "/blog/rag-breaks-earlier-than-people-think/";

const sectionProgress = (page: Page) =>
  page
    .locator("aside:has(nav)")
    .first()
    .evaluate((el) => parseFloat((el as HTMLElement).style.getPropertyValue("--section-progress")));

test("the static HTML has the TOC nav with links to the headings", async ({ request }) => {
  const html = await (await request.get(POST)).text();
  expect(html).toMatch(/<nav[^>]*aria-label="[^"]+"[^>]*>/);
  const tocIds = [...html.matchAll(/<a[^>]*href="#([\w-]+)"/g)].map((m) => m[1]);
  expect(tocIds.length).toBeGreaterThanOrEqual(3);
  for (const id of tocIds.slice(0, 5)) expect(html).toContain(`id="${id}"`);
  expect(html).toContain("<dialog");
});

test.describe("desktop 1280", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("a TOC link scrolls to the heading and marks it current", async ({ page }) => {
    await page.goto(POST);
    const links = page.locator("aside nav a[href^='#']");
    await expect(links.nth(1)).toBeVisible();
    const link = links.nth(1);
    const id = (await link.getAttribute("href"))!.slice(1);
    await link.click();
    await expect(link).toHaveAttribute("aria-current", "location");
    const top = await page.locator(`[id="${id}"]`).evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(-2);
    expect(top).toBeLessThan(400);
  });

  test("the end of the page marks the last item", async ({ page }) => {
    await page.goto(POST);
    const links = page.locator("aside nav a[href^='#']");
    await expect(links.first()).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(links.last()).toHaveAttribute("aria-current", "location");
  });

  test("--section-progress stays in 0..1 and grows inside a section", async ({ page }) => {
    await page.goto(POST);
    const links = page.locator("aside nav a[href^='#']");
    await expect(links.first()).toBeVisible();
    await links.first().click();
    await expect(links.first()).toHaveAttribute("aria-current", "location");
    const start = await sectionProgress(page);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(start).toBeLessThanOrEqual(1);
    await page.mouse.wheel(0, 250);
    await expect.poll(() => sectionProgress(page)).toBeGreaterThan(start);
    expect(await sectionProgress(page)).toBeLessThanOrEqual(1);
  });
});

test.describe("mobile 375", () => {
  test.use({ viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true });

  test("the bottom bar opens a sheet, a link closes it and Esc returns focus", async ({ page }) => {
    await page.goto(POST);
    const button = page.getByRole("button", { name: "Contents" });
    await expect(button).toBeVisible();
    // The bar is in the server HTML; its click handler exists once the client:idle island hydrates.
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
    const dialog = page.getByRole("dialog", { name: "CONTENTS" });

    // The bar does not cover the footer at the end of the page.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const bar = await button.evaluate((el) => el.parentElement!.getBoundingClientRect().top);
    const footerBottom = await page.locator("footer").last().evaluate((el) => el.getBoundingClientRect().bottom);
    expect(footerBottom).toBeLessThanOrEqual(bar + 1);
    await page.evaluate(() => window.scrollTo(0, 0));

    await button.click();
    await expect(dialog).toBeVisible();
    const link = dialog.locator("a[href^='#']").nth(1);
    const id = (await link.getAttribute("href"))!.slice(1);
    await link.click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));

    await button.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("heading anchors are visible without hover and nothing overflows sideways", async ({ page }) => {
    await page.goto(POST);
    const anchor = page.locator(".prose-blog h2 .heading-anchor").first();
    await expect(anchor).toBeAttached();
    expect(await anchor.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test("the post body does not fade in", async ({ page }) => {
  await page.goto(POST);
  const body = page.locator(".prose-blog").first();
  await expect(body).toBeAttached();
  expect(await body.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  // The entrance fade is the [data-reveal] @starting-style; a timing check could miss a finished fade,
  // so assert the trigger itself is absent from the body and every ancestor (LCP is the post text).
  expect(await body.evaluate((el) => el.closest("[data-reveal]") === null)).toBe(true);
});

// The rail must paint above the sticky nav, not only have the right transform: a rail inside a
// stacking context (such as <main>, which has a view-transition name) sits under the nav.
test("the progress rail paints on top of the nav", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(POST);
  await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2));
  await page.evaluate(() => {
    document.querySelector<HTMLElement>(".progress-rail")!.style.pointerEvents = "auto";
  });
  // Poll: the scroll timeline (or the rAF fallback) applies the new scaleX on a later frame.
  await expect
    .poll(() => page.evaluate(() => document.elementFromPoint(innerWidth * 0.25, 0)?.classList.contains("progress-rail")))
    .toBe(true);
});
