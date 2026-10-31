import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

// Decode (src/lib/decode.ts): [data-decode] values decode once on entering the
// viewport. The final text is always in the server HTML.

type Log = Record<string, { texts: string[]; labels: string[]; maxDelta: number; visible: boolean }>;

/** Before any page script runs, record every text, aria-label and box change of each [data-decode] element. */
async function installRecorder(page: Page) {
  await page.addInitScript(() => {
    const log: Log = {};
    (window as unknown as { __decodeLog: Log }).__decodeLog = log;
    const ids = new WeakMap<Element, string>();
    const boxes = new WeakMap<Element, DOMRect>();
    let n = 0;
    const entry = (el: Element) => {
      if (!ids.has(el)) ids.set(el, `d${n++}`);
      return (log[ids.get(el)!] ??= { texts: [], labels: [], maxDelta: 0, visible: false });
    };
    // Boxes are compared only after the web fonts load; a font swap is not a decode shift.
    let fontsReady = false;
    void document.fonts.ready.then(() => (fontsReady = true));
    const sample = () => {
      document.querySelectorAll("[data-decode]").forEach((el) => {
        const e = entry(el);
        const text = el.textContent ?? "";
        if (e.texts.at(-1) !== text) e.texts.push(text);
        const label = el.getAttribute("aria-label");
        if (label !== null && e.labels.at(-1) !== label) e.labels.push(label);
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        e.visible = true;
        if (!fontsReady) return;
        const first = boxes.get(el);
        if (!first) boxes.set(el, r);
        else e.maxDelta = Math.max(e.maxDelta, Math.abs(r.width - first.width), Math.abs(r.height - first.height));
      });
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

const readLog = (page: Page) => page.evaluate(() => (window as unknown as { __decodeLog: Log }).__decodeLog);

// The final text comes from the server HTML, so a scrambled frame can never be mistaken for it.
async function serverHash(request: APIRequestContext): Promise<string> {
  const html = await (await request.get("/")).text();
  return html.match(/data-decode[^>]*>([0-9a-f]{7})</)![1];
}

async function walk(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  await page.waitForTimeout(800);
}

test.describe("decode", () => {
  test("server HTML carries the final values", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toMatch(/data-decode[^>]*>[0-9a-f]{7}</);
  });

  test("no section number is marked for decode", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-decode]").first()).toBeAttached();
    // Section numbers live in SectionHeader's <header>; data values such as "13 weeks" may decode.
    expect(await page.locator("header [data-decode]").count()).toBe(0);
  });

  test("the build hash decodes, keeps its box, ends on the final text, and only the final text is ever its name", async ({ page, request }) => {
    const hash = await serverHash(request);
    await installRecorder(page);
    await page.goto("/");
    // The value decodes when it enters the viewport; below the tall hero it starts off-screen.
    await page.locator("[data-decode]:visible", { hasText: new RegExp(`^${hash}$`) }).first().scrollIntoViewIfNeeded();
    await expect.poll(async () => Object.values(await readLog(page)).some((e) => e.texts.at(-1) === hash && e.texts.length > 1)).toBe(true);
    const entry = Object.values(await readLog(page)).find((e) => e.texts.includes(hash) && e.texts.length > 1)!;
    // It ran through scrambled frames and ended on the hash (the recorder may start mid-decode).
    expect(entry.texts.some((t) => t !== hash)).toBe(true);
    expect(entry.texts.at(-1)).toBe(hash);
    expect(entry.labels.length).toBeGreaterThan(0);
    expect(entry.labels.every((l) => l === hash)).toBe(true);
    expect(entry.maxDelta).toBeLessThan(1);
    const el = page.locator("[data-decode]", { hasText: new RegExp(`^${hash}$`) }).first();
    await expect(el).not.toHaveAttribute("aria-label");
    expect(await el.evaluate((e) => (e as HTMLElement).style.cssText)).toBe("");
  });

  test("at 375px in Russian no decoded value changes its box", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(() => localStorage.setItem("site_preferences", JSON.stringify({ state: { locale: "ru" }, version: 4 })));
    await installRecorder(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-locale", "ru");
    await walk(page);
    const visible = Object.values(await readLog(page)).filter((e) => e.visible);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.filter((e) => e.texts.length > 1).length).toBeGreaterThan(0);
    for (const e of visible) expect(e.maxDelta, e.texts.at(-1)).toBeLessThan(1);
  });

  test("with effects off nothing decodes", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("site_preferences", JSON.stringify({ state: { effects: "off" }, version: 4 })));
    await installRecorder(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-effects", "off");
    await walk(page);
    const log = Object.values(await readLog(page));
    expect(log.length).toBeGreaterThan(0);
    expect(log.every((e) => e.texts.length === 1 && e.labels.length === 0)).toBe(true);
  });
});
