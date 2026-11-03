import { test, expect, type Page } from "@playwright/test";

// The first live <AnatomyFigure> from havamal's anatomy pipeline: the fat-header
// probe machine in "The Network Isn't Broken Everywhere". The post's interactive
// diagrams share the island, so the locator names the figure.
const POST_URL = "/blog/network-isnt-broken-just-here";
const FIGURE = '.anatomy-figure:has([data-anatomy="fat-header-probe"])';

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((value) => {
    localStorage.setItem("site_preferences", JSON.stringify({ state: { theme: value } }));
  }, theme);
}

async function liveFigure(page: Page) {
  const figure = page.locator(FIGURE).first();
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute("data-live-ready", "", { timeout: 10_000 });
  return figure;
}

test.describe("live anatomy figure", () => {
  test("mounts near the viewport, replaces the still, and keeps the caption area", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(POST_URL);
    const figure = page.locator(FIGURE).first();
    await expect(figure).not.toHaveAttribute("data-live-ready");

    await liveFigure(page);
    await expect(figure.locator(".anatomy-figure-plate")).toBeVisible();
    await expect(figure.locator(".blog-figure picture")).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("follows the site theme with the site palette", async ({ page }) => {
    await setTheme(page, "light");
    await page.goto(POST_URL);
    const figure = await liveFigure(page);
    const live = figure.locator(".anatomy-live");
    await expect(live).toHaveAttribute("data-theme", "light");
    const pageToken = () =>
      live.evaluate((el) => getComputedStyle(el).getPropertyValue("--anatomy-page").trim());
    expect(await pageToken()).toBe("#f5f3ee");

    await page.evaluate(() => document.documentElement.classList.replace("light", "dark"));
    await expect(live).toHaveAttribute("data-theme", "dark");
    expect(await pageToken()).toBe("#0b0b0c");
  });

  test("stays still until the reader acts (DESIGN.md rule A12: no tour or loop)", async ({ page }) => {
    await page.goto(POST_URL);
    const figure = await liveFigure(page);
    const snapshot = () =>
      figure.evaluate((el) => {
        const readout = el.querySelector("[data-readout]")?.textContent ?? "";
        const moved = Array.from(el.querySelectorAll("[transform]"), (node) => node.getAttribute("transform")).join("|");
        return readout + "#" + moved;
      });
    const before = await snapshot();
    await page.waitForTimeout(4_500);
    expect(await snapshot()).toBe(before);
  });

  test("the keyboard changes the readout", async ({ page }) => {
    await page.goto(POST_URL);
    const figure = await liveFigure(page);
    const readout = figure.locator("[data-readout]");
    const stage = figure.locator(".iso-stage");
    await stage.focus();
    const before = await readout.textContent();
    await stage.press("ArrowRight");
    await expect.poll(() => readout.textContent(), { timeout: 5_000 }).not.toBe(before);
  });

  test("reduced motion still mounts and responds", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(POST_URL);
    const figure = await liveFigure(page);
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
    const readout = figure.locator("[data-readout]");
    const before = await readout.textContent();
    await figure.locator(".iso-stage").press("ArrowRight");
    await expect.poll(() => readout.textContent(), { timeout: 2_000 }).not.toBe(before);
    await context.close();
  });

  test("without JavaScript the still stays", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(POST_URL);
    const figure = page.locator(FIGURE).first();
    await expect(figure.locator(".blog-figure picture img")).toBeVisible();
    await expect(figure.locator(".anatomy-figure-plate")).toBeHidden();
    await context.close();
  });
});
