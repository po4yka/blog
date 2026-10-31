import { test, expect, type Page } from "@playwright/test";

// Reveal (src/components/ui/Reveal.tsx) must never hide content: the server
// HTML is final, and the @starting-style fade is only an enhancement.

const PAGES = ["/", "/blog/", "/blog/rag-breaks-earlier-than-people-think/", "/projects/", "/experience/", "/this-page-does-not-exist/"];

async function revealOpacities(page: Page) {
  const reveals = page.locator("[data-reveal]");
  await expect(reveals.first()).toBeAttached();
  return reveals.evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
}

test.describe("Reveal keeps content visible", () => {
  for (const path of PAGES) {
    test(`server HTML of ${path} hides nothing with an inline opacity of 0`, async ({ request }) => {
      const html = await (await request.get(path)).text();
      expect(html).toContain("data-reveal");
      // Any element with content at opacity 0. Empty ones (the copy-confirmation
      // tick before a click) carry no content and are allowed.
      const hidden = [...html.matchAll(/<(\w+)(?=[\s>])[^>]*style="[^"]*opacity:\s*0(?![.\d])[^"]*"[^>]*>(?!<\/\1>)/g)].map(
        (m) => m[0].slice(0, 160),
      );
      expect(hidden).toEqual([]);
    });
  }

  test.describe("with JavaScript off", () => {
    test.use({ javaScriptEnabled: false });

    for (const path of PAGES) {
      test(`${path} settles at full opacity`, async ({ page }) => {
        await page.goto(path);
        await expect.poll(async () => (await revealOpacities(page)).every((o) => o === "1")).toBe(true);
      });
    }
  });

  test.describe("under reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("content is at full opacity with no opacity transition running", async ({ page }) => {
      await page.goto("/");
      expect((await revealOpacities(page)).every((o) => o === "1")).toBe(true);
      const running = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a instanceof CSSTransition && a.transitionProperty === "opacity" && a.playState === "running")
          .map((a) => (a.effect as KeyframeEffect).target?.nodeName),
      );
      expect(running).toEqual([]);
    });
  });
});

test("the fade is wired: @starting-style is loaded and reveals transition opacity", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "CSSStartingStyleRule check is Chromium-specific");
  await page.goto("/");
  const startingStyleRules = await page.evaluate(() => {
    let count = 0;
    const walk = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        if (rule.constructor.name === "CSSStartingStyleRule" && rule.cssText.includes("data-reveal")) count++;
        if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules);
      } catch {
        // cross-origin sheet
      }
    }
    return count;
  });
  expect(startingStyleRules).toBeGreaterThan(0);
  const transition = await page.locator("main [data-reveal]").first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { property: cs.transitionProperty, duration: parseFloat(cs.transitionDuration) };
  });
  expect(transition.property).toContain("opacity");
  expect(transition.duration).toBeGreaterThan(0);
});
