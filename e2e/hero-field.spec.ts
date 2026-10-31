import { test, expect, type Page } from "@playwright/test";

const STORAGE_KEY = "site_preferences";

type Counter = { __moves: number };

const canvasHash = (page: Page) =>
  page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>(".hero-field canvas")!;
    const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let h = 0;
    for (let i = 3; i < d.length; i += 17) h = (h * 31 + d[i]!) | 0;
    return h;
  });

const setPrefs = (page: Page, state: Record<string, unknown>) =>
  page.addInitScript(
    ([key, value]) => localStorage.setItem(key as string, JSON.stringify({ state: value, version: 4 })),
    [STORAGE_KEY, state] as const,
  );

test.describe("hero field", () => {
  test("caption names the seed, the h1 stays real text above the layer", async ({ page }) => {
    await page.goto("/");
    const caption = page.locator(".hero-field-row p");
    await expect(caption).toContainText(/13 weeks of commits to po4yka\/blog, built [0-9a-f]{7}/i);
    await expect(caption.locator("[data-decode]:visible")).toHaveCount(2);
    await expect(page.locator("h1#hero-heading")).toContainText("Nikita");
    expect(await page.locator(".hero-field").evaluate((el) => getComputedStyle(el).zIndex)).toBe("-1");
  });

  test("canvas draws and loops, pause stops it by mouse and by keyboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".hero-field")).toHaveAttribute("data-field", "live");
    const pause = page.getByRole("button", { name: "pause field" });
    await expect(pause).toHaveAttribute("aria-pressed", "false");

    const a = await canvasHash(page);
    await page.waitForTimeout(500);
    expect(await canvasHash(page)).not.toBe(a);

    await pause.click();
    await expect(pause).toHaveAttribute("aria-pressed", "true");
    const frozen = await canvasHash(page);
    await page.waitForTimeout(500);
    expect(await canvasHash(page)).toBe(frozen);

    await pause.focus();
    await page.keyboard.press("Enter");
    await expect(pause).toHaveAttribute("aria-pressed", "false");
    await page.waitForTimeout(500);
    expect(await canvasHash(page)).not.toBe(frozen);
  });

  test("pause control is a 44px target on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const box = await page.getByRole("button", { name: "pause field" }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });

  test("does not loop under stored reduced motion, and the control is hidden", async ({ page }) => {
    await setPrefs(page, { reduceMotion: true });
    await page.goto("/");
    await expect(page.locator(".hero-field")).toHaveAttribute("data-field", "live");
    await expect(page.locator(".hero-zone")).toHaveAttribute("data-field-mode", "still");
    const a = await canvasHash(page);
    await page.waitForTimeout(500);
    expect(await canvasHash(page)).toBe(a);
    await expect(page.getByRole("button", { name: "pause field" })).toBeHidden();
  });

  test("effects reduced draws one still frame", async ({ page }) => {
    await setPrefs(page, { effects: "reduced" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-effects", "reduced");
    await expect(page.locator(".hero-zone")).toHaveAttribute("data-field-mode", "still");
    const a = await canvasHash(page);
    await page.waitForTimeout(500);
    expect(await canvasHash(page)).toBe(a);
  });

  test("effects off removes the field, the poster and the caption row", async ({ page }) => {
    await setPrefs(page, { effects: "off" });
    await page.goto("/");
    await expect(page.locator(".hero-field")).toBeHidden();
    await expect(page.locator(".hero-field-poster")).toBeHidden();
    await expect(page.locator(".hero-field-row")).toBeHidden();
    await expect(page.locator("h1#hero-heading")).toBeVisible();
  });

  test("the effects setting changes from Settings and persists", async ({ page }) => {
    await page.goto("/settings");
    const group = page.getByRole("group", { name: "effects" });
    await group.getByRole("button", { name: "off" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-effects", "off");
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY);
    expect(stored.state.effects).toBe("off");
    expect(stored.version).toBe(4);
    await group.getByRole("button", { name: "full" }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-effects", /.*/);
  });

  test("the layout does not move when the canvas takes over", async ({ page }) => {
    await page.goto("/");
    const top = () => page.locator(".hero-field-row").evaluate((el) => el.getBoundingClientRect().top + scrollY);
    const before = await top();
    await expect(page.locator(".hero-field")).toHaveAttribute("data-field", "live");
    expect(await top()).toBe(before);
  });

  test("a paused field ignores the pointer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".hero-field")).toHaveAttribute("data-field", "live");
    await page.getByRole("button", { name: "pause field" }).click();
    const box = (await page.locator(".hero-field").boundingBox())!;
    const still = await canvasHash(page);
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.waitForTimeout(300);
    expect(await canvasHash(page)).toBe(still);
  });

  test.describe("coarse pointer", () => {
    test.use({ hasTouch: true, isMobile: true });

    test("attaches no pointermove listener to the zone", async ({ page }) => {
      await page.addInitScript(() => {
        const w = window as unknown as Counter;
        w.__moves = 0;
        const add = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, ...rest: unknown[]) {
          if (type === "pointermove" && (this as Element).classList?.contains("hero-zone")) w.__moves++;
          return (add as (...a: unknown[]) => void).call(this, type, ...rest);
        };
      });
      await page.goto("/");
      await expect(page.locator(".hero-field")).toHaveAttribute("data-field", "live");
      expect(await page.evaluate(() => (window as unknown as Counter).__moves)).toBe(0);
    });
  });
});
