import { test, expect } from "@playwright/test";

const POST_URL = "/blog/rag-breaks-earlier-than-people-think";

test.describe("blog image lightbox", () => {
  test("opens from shared figure URL, navigates, and closes cleanly", async ({ page }) => {
    await page.goto(`${POST_URL}?fig=2`);
    await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("02 / 03")).toBeVisible();

    await page.getByRole("button", { name: "Next image" }).click();
    await expect(page).toHaveURL(/fig=3/);
    await expect(page.getByText("03 / 03")).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeHidden();
    await expect(page).not.toHaveURL(/fig=/);
  });

  test("opens from an article image with thumbnail navigation", async ({ page }) => {
    await page.goto(POST_URL);
    const imageButton = page.getByRole("button", { name: /Open image:/ }).first();
    await expect(imageButton).toBeVisible();

    await imageButton.click();
    await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeVisible();
    await expect(page).toHaveURL(/fig=1/);
    await expect(page.getByRole("tablist", { name: "Figures" })).toBeVisible();

    await page.getByRole("tab", { name: "Go to figure 2" }).click();
    await expect(page).toHaveURL(/fig=2/);
    await expect(page.getByText("02 / 03")).toBeVisible();
  });
  test.describe("shared-element transition", () => {
    const spyOnTransitions = async (page: import("@playwright/test").Page) => {
      await page.addInitScript(() => {
        const w = window as unknown as { __vt: number };
        w.__vt = 0;
        const original = document.startViewTransition?.bind(document);
        if (!original) return;
        document.startViewTransition = ((cb: () => void) => {
          w.__vt += 1;
          return original(cb);
        }) as typeof document.startViewTransition;
      });
    };

    test("runs on open and close, and leaves no view-transition-name behind", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "View Transitions API is checked in Chromium");
      await spyOnTransitions(page);
      await page.goto(POST_URL);
      const imageButton = page.getByRole("button", { name: /Open image:/ }).first();
      await imageButton.scrollIntoViewIfNeeded();
      await imageButton.click();
      await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeVisible();
      expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(1);
      await expect(page).toHaveURL(/fig=1/);

      await page.getByRole("button", { name: "Close" }).click();
      await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeHidden();
      expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(2);
      await expect(page).not.toHaveURL(/fig=/);

      const leftover = await page.evaluate(
        () => [...document.querySelectorAll<HTMLElement>("img")].filter((el) => el.style.viewTransitionName).length,
      );
      expect(leftover).toBe(0);
    });

    test("a ?fig= deep link opens without a transition", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "View Transitions API is checked in Chromium");
      await spyOnTransitions(page);
      await page.goto(`${POST_URL}?fig=2`);
      await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeVisible({ timeout: 10_000 });
      expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(0);
    });

    test.describe("reduced motion", () => {
      test.use({ reducedMotion: "reduce" });

      test("skips the transition", async ({ page }) => {
        await spyOnTransitions(page);
        await page.goto(POST_URL);
        await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
        await page.getByRole("button", { name: /Open image:/ }).first().click();
        await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeVisible();
        await page.getByRole("button", { name: "Close" }).click();
        await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeHidden();
        expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(0);
      });
    });
  });
});
