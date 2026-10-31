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

const pauseButton = (page: Page) => page.locator(".hero-field-pause");

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
    const pause = pauseButton(page);
    // One state signal: the label names the action; no aria-pressed.
    await expect(pause).not.toHaveAttribute("aria-pressed");
    await expect(pause).toHaveText(/pause field/);

    const a = await canvasHash(page);
    await page.waitForTimeout(500);
    expect(await canvasHash(page)).not.toBe(a);

    await pause.click();
    await expect(pause).toHaveAttribute("data-paused", "true");
    await expect(pause).toHaveText(/resume field/);
    await expect(pause).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const frozen = await canvasHash(page);
    await page.waitForTimeout(500);
    expect(await canvasHash(page)).toBe(frozen);

    await pause.focus();
    await page.keyboard.press("Enter");
    await expect(pause).not.toHaveAttribute("data-paused");
    await expect(pause).toHaveText(/pause field/);
    await page.waitForTimeout(500);
    expect(await canvasHash(page)).not.toBe(frozen);
  });

  for (const width of [375, 1280]) {
    test(`pause control is a 44px target at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.locator(".hero-field")).toHaveAttribute("data-field", "live");
      const pause = pauseButton(page);
      await expect(pause).toBeVisible();
      const box = (await pause.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      // The 44px height comes from a ::after hit area, so points 20px above and below the label still hit the button.
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      for (const dy of [-20, 20]) {
        const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest(".hero-field-pause") !== null, [cx, cy + dy]);
        expect(hit, `${dy}px from the centre`).toBe(true);
      }
    });
  }

  test("does not loop under stored reduced motion, and the control is hidden", async ({ page }) => {
    await setPrefs(page, { reduceMotion: true });
    await page.goto("/");
    await expect(page.locator(".hero-field")).toHaveAttribute("data-field", "live");
    await expect(page.locator(".hero-zone")).toHaveAttribute("data-field-mode", "still");
    const a = await canvasHash(page);
    await page.waitForTimeout(500);
    expect(await canvasHash(page)).toBe(a);
    await expect(pauseButton(page)).toBeHidden();
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

  test("saveData keeps the poster and never creates the canvas", async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true } }));
    await page.goto("/");
    await expect(page.locator(".hero-field-poster")).toBeVisible();
    await expect(page.locator(".hero-zone")).toHaveAttribute("data-field-mode", "still");
    await page.waitForTimeout(500);
    await expect(page.locator(".hero-field")).not.toHaveAttribute("data-field", "live");
    // A canvas that was never sized keeps the 300x150 default.
    expect(await page.locator(".hero-field canvas").evaluate((c: HTMLCanvasElement) => c.width)).toBe(300);
    await expect(pauseButton(page)).toBeHidden();
  });

  test("effects off removes the field, the poster and the caption row", async ({ page }) => {
    await setPrefs(page, { effects: "off" });
    await page.goto("/");
    await page.waitForTimeout(500);
    expect(await page.locator(".hero-field canvas").evaluate((c: HTMLCanvasElement) => c.width)).toBe(300);
    await expect(page.locator(".hero-field")).toBeHidden();
    await expect(page.locator(".hero-field-poster")).toBeHidden();
    await expect(page.locator(".hero-field-row")).toBeHidden();
    await expect(page.locator("h1#hero-heading")).toBeVisible();
  });

  test("the effects setting changes from Settings and persists", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator('astro-island[component-url*="SettingsIsland"]')).not.toHaveAttribute("ssr", { timeout: 10_000 });
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
    await pauseButton(page).click();
    await expect(pauseButton(page)).toHaveAttribute("data-paused", "true");
    // A frame already queued when the click landed may still draw once.
    await page.waitForTimeout(150);
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
