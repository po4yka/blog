import { test, expect, type Page } from "@playwright/test";

// Interactive diagrams (havamal's figures/interactive/ pipeline) mount through
// the same island as the anatomy figures: the verdict decision flow in "The
// Network Isn't Broken Everywhere" is the first one.
const POST_URL = "/blog/network-isnt-broken-just-here";
const FIGURE = '.anatomy-figure:has([data-anatomy="02-verdict-decision-flow"])';

async function liveFigure(page: Page) {
  const figure = page.locator(FIGURE).first();
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute("data-live-ready", "", {
    timeout: 10_000,
  });
  return figure;
}

test.describe("interactive diagram", () => {
  test("mounts, keeps the drawing in the site palette, and replaces the still", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(POST_URL);
    const figure = await liveFigure(page);
    const live = figure.locator(".diagram-live");
    await expect(live).toBeVisible();
    await expect(figure.locator(".blog-figure picture")).toBeHidden();
    const ink = () =>
      live.evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--dg-ink").trim(),
      );
    const siteInk = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--foreground")
          .trim(),
      );
    expect(await ink()).toBe(await siteInk());
    await page.evaluate(() =>
      document.documentElement.classList.toggle("dark"),
    );
    await expect
      .poll(async () => (await ink()) === (await siteInk()))
      .toBe(true);
    expect(errors).toEqual([]);
  });

  test("the keyboard and the chips change the readout", async ({ page }) => {
    await page.goto(POST_URL);
    const figure = await liveFigure(page);
    const readout = figure.locator("[data-readout]");
    const stage = figure.locator(".diagram-stage");
    await stage.focus();
    const before = await readout.textContent();
    await stage.press("ArrowRight");
    await expect
      .poll(() => readout.textContent(), { timeout: 5_000 })
      .not.toBe(before);
    const chips = figure.locator(".diagram-chip");
    expect(await chips.count()).toBeGreaterThan(1);
    const afterKey = await readout.textContent();
    await chips.first().click();
    await expect
      .poll(() => readout.textContent(), { timeout: 5_000 })
      .not.toBe(afterKey);
  });

  test("stays still until the reader acts (DESIGN.md rule A12)", async ({
    page,
  }) => {
    await page.goto(POST_URL);
    const figure = await liveFigure(page);
    const snapshot = () =>
      figure.evaluate((el) => {
        const readout = el.querySelector("[data-readout]")?.textContent ?? "";
        const on = Array.from(
          el.querySelectorAll(".is-on, .is-dim"),
          (node) => node.className.baseVal ?? node.className,
        ).join("|");
        return readout + "#" + on;
      });
    const before = await snapshot();
    await page.waitForTimeout(3_000);
    expect(await snapshot()).toBe(before);
  });

  test("reduced motion mounts without transitions and still responds", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(POST_URL);
    const figure = await liveFigure(page);
    await expect(figure.locator(".diagram-live")).toHaveAttribute(
      "data-motion",
      "reduce",
    );
    const readout = figure.locator("[data-readout]");
    const before = await readout.textContent();
    await figure.locator(".diagram-stage").press("ArrowRight");
    await expect
      .poll(() => readout.textContent(), { timeout: 2_000 })
      .not.toBe(before);
    await context.close();
  });
});
