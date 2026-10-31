import { test, expect } from "@playwright/test";

// Decode (src/lib/decode.ts): [data-decode] values decode once on entering the
// viewport. The final text is always in the server HTML.

test.describe("decode", () => {
  test("server HTML carries the final values", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toMatch(/data-decode[^>]*>[0-9a-f]{7}</);
  });

  test("no section number is marked for decode", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-decode]").first()).toBeAttached();
    const numeric = await page.locator("[data-decode]").evaluateAll((els) => els.filter((e) => /^\d{2}$/.test(e.textContent ?? "")).length);
    expect(numeric).toBe(0);
  });

  test("final text and width are restored once the decode ends", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("[data-decode]:visible").first();
    await el.scrollIntoViewIfNeeded();
    const final = (await el.textContent()) ?? "";
    await expect.poll(() => el.evaluate((e) => e.hasAttribute("aria-label"))).toBe(false);
    await expect(el).toHaveText(final);
    expect(await el.evaluate((e) => (e as HTMLElement).style.width)).toBe("");
  });

  test("the scramble never reaches the accessible name", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("[data-decode]:visible").first();
    const final = (await el.textContent()) ?? "";
    const seen = await el.evaluate(async (e) => {
      const labels = new Set<string>();
      const end = performance.now() + 700;
      while (performance.now() < end) {
        const l = e.getAttribute("aria-label");
        if (l) labels.add(l);
        await new Promise((r) => requestAnimationFrame(r));
      }
      return [...labels];
    });
    for (const l of seen) expect(l).toBe(final);
  });

  test("effects off leaves the text untouched", async ({ page }) => {
    await page.addInitScript(() => document.documentElement.setAttribute("data-effects", "off"));
    await page.goto("/");
    const el = page.locator("[data-decode]:visible").first();
    const final = (await el.textContent()) ?? "";
    const touched = await el.evaluate(async (e) => {
      let t = false;
      new MutationObserver(() => (t = true)).observe(e, { childList: true, characterData: true, subtree: true, attributes: true });
      await new Promise((r) => setTimeout(r, 700));
      return t;
    });
    expect(touched).toBe(false);
    await expect(el).toHaveText(final);
  });
});
