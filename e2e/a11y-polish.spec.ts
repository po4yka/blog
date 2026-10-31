import { test, expect, type Page } from "@playwright/test";

const storeLocale = (page: Page, locale: "en" | "ru") =>
  page.addInitScript((l) => localStorage.setItem("site_preferences", JSON.stringify({ state: { locale: l }, version: 3 })), locale);

test("the home page hydrates in Russian without React errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/github/**", (r) => r.abort());
  await storeLocale(page, "ru");
  await page.goto("/");
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(1500);
  expect(errors.filter((e) => /hydrat|#418|#423|#425/i.test(e))).toEqual([]);
});

test("Tab leaves the footer shell input", async ({ page }) => {
  await page.goto("/");
  const input = page.locator("footer input").first();
  await input.focus();
  await page.keyboard.press("Tab");
  await expect(input).not.toBeFocused();
});

test("the experience page prints real counts in its static HTML", async ({ request }) => {
  const html = await (await request.get("/experience/")).text();
  // The count-up is gone: no number starts from 0 in the server HTML.
  expect(html).not.toMatch(/>0<\/span>\s*positions indexed/);
  expect(html).toMatch(/>?\d+ positions indexed/);
});

test("filtering the blog by tag presses the tag and announces the count", async ({ page }) => {
  await page.goto("/blog/");
  await expect(page.locator('astro-island[component-url*="BlogListIsland"]')).not.toHaveAttribute("ssr", { timeout: 10_000 });
  const tag = page.locator("button[aria-pressed]").first();
  await tag.click();
  await expect(tag).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('main [role="status"]').first()).toHaveText(/\d/);
});

test("gg top jumps without smooth scrolling under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 2000));
  await page.evaluate(() => {
    const calls: unknown[] = [];
    (window as unknown as { __calls: unknown[] }).__calls = calls;
    const orig = window.scrollTo.bind(window);
    window.scrollTo = ((...args: unknown[]) => {
      calls.push(args[0]);
      return (orig as (...a: unknown[]) => void)(...args);
    }) as typeof window.scrollTo;
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  const top = page.getByRole("button", { name: /scroll to top/i });
  await expect(top).toBeVisible();
  await top.click();
  const calls = await page.evaluate(() => (window as unknown as { __calls: { behavior?: string }[] }).__calls);
  expect(calls.at(-1)?.behavior).toBe("auto");
});
