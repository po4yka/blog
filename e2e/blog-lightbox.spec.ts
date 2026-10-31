import { test, expect } from "@playwright/test";
import { installVtRecorder, readVt, readVtCalls, supportsVt } from "./helpers/viewTransitions";

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
    test("runs on open and close, and leaves no view-transition-name behind", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "View Transitions API is checked in Chromium");
      await installVtRecorder(page);
      await page.goto(POST_URL);
      const imageButton = page.getByRole("button", { name: /Open image:/ }).first();
      await imageButton.scrollIntoViewIfNeeded();
      await imageButton.click();
      await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeVisible();
      expect(await readVtCalls(page)).toBe(1);
      await expect
        .poll(
          async () =>
            (await readVt(page)).find((a) => a.pseudo === "::view-transition-group(lightbox-figure)")?.duration,
        )
        .toBeLessThanOrEqual(300);
      await expect(page).toHaveURL(/fig=1/);

      await page.getByRole("button", { name: "Close" }).click();
      await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeHidden();
      expect(await readVtCalls(page)).toBe(2);
      await expect(page).not.toHaveURL(/fig=/);

      await expect
        .poll(() =>
          page.evaluate(
            () => [...document.querySelectorAll<HTMLElement>("img")].filter((el) => el.style.viewTransitionName).length,
          ),
        )
        .toBe(0);
      await expect(page.locator("[data-lightbox-image]")).toHaveCount(0);
    });

    test("a ?fig= deep link opens without a transition", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "View Transitions API is checked in Chromium");
      await installVtRecorder(page);
      await page.goto(`${POST_URL}?fig=2`);
      await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeVisible({ timeout: 10_000 });
      if (await supportsVt(page)) expect(await readVtCalls(page)).toBe(0);
      expect((await readVt(page)).filter((a) => a.pseudo.includes("lightbox-figure"))).toEqual([]);
    });

    test.describe("reduced motion", () => {
      test.use({ reducedMotion: "reduce" });

      test("skips the transition", async ({ page }) => {
        await installVtRecorder(page);
        await page.goto(POST_URL);
        await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
        await page
          .getByRole("button", { name: /Open image:/ })
          .first()
          .click();
        await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeVisible();
        await page.getByRole("button", { name: "Close" }).click();
        await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeHidden();
        if (await supportsVt(page)) expect(await readVtCalls(page)).toBe(0);
        expect((await readVt(page)).filter((a) => a.pseudo.includes("lightbox-figure"))).toEqual([]);
      });
    });
  });
});
