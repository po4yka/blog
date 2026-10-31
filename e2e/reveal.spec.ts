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

// Rules (.rule-draw) draw as they scroll into view where scroll timelines exist (src/styles/scroll.css)
// and on load elsewhere. Either way the end state is the full rule.
// A drawn rule is an inset with a zero right edge (Chromium serialises it as "inset(0px 0% 0px 0px)").
// `none` is not accepted: every rule-draw ends with fill-mode both, so `none` means no draw ran at all.
const DRAWN = /^inset\(0px( 0(px|%) 0px 0px)?\)$/;

test.describe("scroll-drawn rules", () => {
  for (const path of ["/", "/blog/rag-breaks-earlier-than-people-think/"]) {
    test(`every rule on ${path} is fully drawn once scrolled to`, async ({ page }) => {
      await page.goto(path);
      const rules = page.locator(".rule-draw");
      const count = await rules.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await rules.nth(i).evaluate((el) => el.scrollIntoView({ block: "center" }));
        // A load-time draw starts when its island hydrates (client:visible) and may wait for a reveal delay.
        await expect
          .poll(() => rules.nth(i).evaluate((el) => getComputedStyle(el).clipPath), { message: `rule ${i} on ${path}` })
          .toMatch(DRAWN);
      }
    });
  }

  test("a section rule below the fold waits for scroll in Chromium", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "scroll timeline check is Chromium-specific");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const rule = page.locator(".rule-scroll").last();
    expect(await rule.evaluate((el) => getComputedStyle(el).animationTimeline)).toBe("--section-rule");
    // Far below the fold the header has not entered its range, so the rule is still clipped.
    expect(await rule.evaluate((el) => getComputedStyle(el).clipPath)).toContain("100%");
    await rule.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect.poll(() => rule.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(DRAWN);
  });

  test.describe("under reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("does not use the scroll timeline", async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "scroll timeline check is Chromium-specific");
      await page.goto("/");
      const rule = page.locator(".rule-scroll").last();
      expect(await rule.evaluate((el) => getComputedStyle(el).animationTimeline)).not.toBe("--section-rule");
      expect(await rule.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(DRAWN);
    });
  });
});
