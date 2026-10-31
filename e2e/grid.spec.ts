import { test, expect, type Page } from "@playwright/test";

const STORAGE_KEY = "site_preferences";
const POST = "/blog/rag-breaks-earlier-than-people-think/";
const PAGES = ["/", "/projects/", "/experience/", "/blog/", POST, "/blog/ru/", "/settings/", "/privacy/", "/changelog/"];

const guideDisplay = (page: Page) =>
  page.locator(".grid-guides").evaluate((el) => getComputedStyle(el).display);
const markDisplay = (page: Page) =>
  page.locator(".reg-marks").first().evaluate((el) => getComputedStyle(el, "::before").display);

test.describe("grid guides at 1280", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("draw 13 vertical lines on the content box of <main>", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".grid-guides")).toBeVisible();
    const m = await page.evaluate(() => {
      const spans = [...document.querySelectorAll<HTMLElement>(".grid-guides span")];
      const main = document.querySelector("main")!;
      const cs = getComputedStyle(main);
      const box = main.getBoundingClientRect();
      const first = spans[0]!.getBoundingClientRect();
      const last = spans[spans.length - 1]!.getBoundingClientRect();
      return {
        spans: spans.length,
        lines:
          spans.filter((s) => parseFloat(getComputedStyle(s).borderInlineStartWidth) === 1).length +
          (parseFloat(getComputedStyle(spans[spans.length - 1]!).borderInlineEndWidth) === 1 ? 1 : 0),
        guideLeft: first.left,
        guideRight: last.right,
        mainLeft: box.left + parseFloat(cs.paddingLeft),
        mainRight: box.right - parseFloat(cs.paddingRight),
      };
    });
    expect(m.spans).toBe(12);
    expect(m.lines).toBe(13);
    expect(Math.abs(m.guideLeft - m.mainLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.guideRight - m.mainRight)).toBeLessThanOrEqual(1);
  });

  test("registration marks show on a section header", async ({ page }) => {
    await page.goto("/projects/");
    expect(await markDisplay(page)).toBe("block");
  });

  test("forced colors and print hide guides and marks", async ({ page }) => {
    await page.goto("/projects/");
    await page.emulateMedia({ forcedColors: "active" });
    expect(await guideDisplay(page)).toBe("none");
    expect(await markDisplay(page)).toBe("none");
    await page.emulateMedia({ forcedColors: "none" });
    expect(await guideDisplay(page)).toBe("block");
    await page.emulateMedia({ media: "print" });
    expect(await guideDisplay(page)).toBe("none");
    expect(await markDisplay(page)).toBe("none");
  });

  test.describe("with the preference stored off", () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(
        ([key]) => localStorage.setItem(key!, JSON.stringify({ state: { gridGuides: false }, version: 3 })),
        [STORAGE_KEY],
      );
    });

    test("data-grid is off before paint, and stays off after a client navigation", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-grid", "off");
      expect(await guideDisplay(page)).toBe("none");
      await page.goto("/projects/");
      expect(await markDisplay(page)).toBe("none");
      await page.getByRole("link", { name: /blog/i }).first().click();
      await expect(page).toHaveURL(/\/blog/);
      await expect(page.locator("html")).toHaveAttribute("data-grid", "off");
      expect(await guideDisplay(page)).toBe("none");
    });
  });

  test("the Settings toggle hides and restores the guides", async ({ page }) => {
    await page.goto("/settings/");
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
    await page.reload();
    const group = page.getByRole("group", { name: "grid_guides" });
    await group.getByRole("button", { name: "hidden", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-grid", "off");
    await expect.poll(() => guideDisplay(page)).toBe("none");
    await group.getByRole("button", { name: "shown", exact: true }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-grid", /.*/);
    await expect.poll(() => guideDisplay(page)).toBe("block");
  });
});

test("guides are not displayed at 375", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  expect(await guideDisplay(page)).toBe("none");
});

test.describe("no horizontal overflow", () => {
  for (const width of [320, 375, 1280]) {
    test(`at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of PAGES) {
        await page.goto(path);
        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(scrollWidth, `${path} at ${width}px`).toBeLessThanOrEqual(innerWidth);
      }
    });
  }
});
