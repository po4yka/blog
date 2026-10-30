import { test, expect } from "@playwright/test";

// The home page must not shift while it loads, even on a slow network with slow
// GitHub data: islands hydrate into the same boxes the static HTML reserved.

for (const width of [375, 1280]) {
  test(`no layout shift on / at ${width}px with a slow network`, async ({ page, browserName, context }) => {
    test.skip(browserName !== "chromium", "layout-shift entries and network throttling need Chromium");
    test.setTimeout(60_000); // throttled load plus a full scroll
    await page.setViewportSize({ width, height: 812 });
    await page.addInitScript(() => {
      const shifts: { value: number; sources: string[] }[] = [];
      (window as unknown as { __shifts: typeof shifts }).__shifts = shifts;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
          sources?: { node?: Node | null }[];
        })[]) {
          if (entry.hadRecentInput) continue;
          shifts.push({
            value: entry.value,
            sources: (entry.sources ?? []).map((s) => (s.node instanceof Element ? `${s.node.tagName}.${s.node.className}` : "?")),
          });
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 200_000,
      uploadThroughput: 100_000,
    });
    // GitHub data arrives late and fails, the worst case for the data panels.
    await page.route("**/api/github/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await route.abort();
    });
    await page.goto("/", { waitUntil: "load" });
    // Walk the page so the client:visible data panels hydrate, fetch, and fail.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    });
    await page.waitForTimeout(4_000);
    const shifts = await page.evaluate(() => (window as unknown as { __shifts: { value: number; sources: string[] }[] }).__shifts);
    const cls = shifts.reduce((sum, s) => sum + s.value, 0);
    expect(cls, JSON.stringify(shifts)).toBeLessThan(0.001);
  });
}
