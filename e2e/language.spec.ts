import { test, expect, type Page } from "@playwright/test";

// The four static home sections (Links, Projects, Experience, Blog) render both
// languages in the HTML; html[data-locale], set before paint, shows one. Text is
// read with innerText, which skips the hidden (display: none) language.

const STORAGE_KEY = "site_preferences";
const RU_PROJECTS = "Избранные проекты";
const EN_PROJECTS = "Selected Projects";

const heroHeading = (page: Page) => page.locator("#hero-heading");
const projectsHeading = (page: Page) => page.locator("#projects-heading");

async function storeLocale(page: Page, locale: "en" | "ru") {
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, JSON.stringify({ state: { locale: value }, version: 3 })),
    [STORAGE_KEY, locale] as const,
  );
}

test.describe("Static sections follow the stored language", () => {
  test("default is English", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-locale", "en");
    await expect(projectsHeading(page)).toHaveText(EN_PROJECTS, { useInnerText: true });
    await expect(heroHeading(page)).toHaveText("Nikita Pochaev", { useInnerText: true });
  });

  test("a stored Russian preference shows Russian from the first paint, with no English flash", async ({ page }) => {
    await storeLocale(page, "ru");
    // Record every value data-locale takes, from before the first script runs.
    await page.addInitScript(() => {
      const seen: string[] = [];
      (window as unknown as { __locales: string[] }).__locales = seen;
      new MutationObserver(() => {
        const value = document.documentElement.getAttribute("data-locale");
        if (value && seen[seen.length - 1] !== value) seen.push(value);
      }).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-locale"] });
    });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-locale", "ru");
    await expect(projectsHeading(page)).toHaveText(RU_PROJECTS, { useInnerText: true });
    expect(await page.evaluate(() => (window as unknown as { __locales: string[] }).__locales)).toEqual(["ru"]);
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(heroHeading(page)).toHaveText("Никита Почаев", { useInnerText: true });
  });

  test("the switcher changes the language in place, without a reload", async ({ page }) => {
    await page.goto("/");
    // The switcher lives in the client:idle Nav island; wait until it has hydrated.
    await expect(page.locator("astro-island:has(nav)")).not.toHaveAttribute("ssr");
    await page.evaluate(() => ((window as unknown as { __sameDocument: boolean }).__sameDocument = true));
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("button", { name: "RU", exact: true })
      .first()
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-locale", "ru");
    await expect(projectsHeading(page)).toHaveText(RU_PROJECTS, { useInnerText: true });
    await expect(heroHeading(page)).toHaveText("Никита Почаев", { useInnerText: true });
    expect(await page.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument)).toBe(true);
  });
});

test.describe("Blog language", () => {
  // The first nav in the page. Its accessible name follows the language.
  const primaryNav = (page: Page) => page.locator("nav").first();
  const hydrated = (page: Page) => expect(page.locator("astro-island", { has: primaryNav(page) }).first()).not.toHaveAttribute("ssr");

  test("the switcher moves between the blog indexes", async ({ page }) => {
    await page.goto("/blog");
    await hydrated(page);
    await primaryNav(page).getByRole("button", { name: "RU", exact: true }).first().click();
    await expect(page).toHaveURL(/\/blog\/ru\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");

    await hydrated(page);
    await expect(primaryNav(page).getByRole("button", { name: "RU", exact: true }).first()).toHaveAttribute("aria-pressed", "true");
    await primaryNav(page).getByRole("button", { name: "EN", exact: true }).first().click();
    await expect(page).toHaveURL(/\/blog\/?$/);
  });

  test("after a soft navigation from a post, the switcher still moves between the indexes", async ({ page }) => {
    await page.goto("/blog/rag-breaks-earlier-than-people-think");
    await hydrated(page);
    await primaryNav(page).getByRole("link", { name: "blog" }).click();
    await expect(page).toHaveURL(/\/blog\/?$/);
    await primaryNav(page).getByRole("button", { name: "RU", exact: true }).first().click();
    await expect(page).toHaveURL(/\/blog\/ru\/?$/);
  });

  test("the lang command moves between the blog indexes", async ({ page }) => {
    await page.goto("/blog");
    await hydrated(page);
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox").fill("Language: RU");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/blog\/ru\/?$/);
  });

  test("with Russian stored, every Blog link on the home page goes to the Russian index", async ({ page }) => {
    await storeLocale(page, "ru");
    await page.goto("/");
    await hydrated(page);
    await expect(primaryNav(page).getByRole("link", { name: "блог" })).toHaveAttribute("href", "/blog/ru");
    const hrefs = await page.locator('a[href="/blog"], a[href="/blog/ru"]').evaluateAll((links) =>
      links.filter((a) => a.getClientRects().length > 0).map((a) => a.getAttribute("href")),
    );
    expect(hrefs.length).toBeGreaterThanOrEqual(3);
    expect(new Set(hrefs)).toEqual(new Set(["/blog/ru"]));
  });

  test("with no stored language, the home page Blog links go to the English index", async ({ page }) => {
    await page.goto("/");
    await hydrated(page);
    const hrefs = await page.locator('a[href="/blog"], a[href="/blog/ru"]').evaluateAll((links) =>
      links.filter((a) => a.getClientRects().length > 0).map((a) => a.getAttribute("href")),
    );
    expect(new Set(hrefs)).toEqual(new Set(["/blog"]));
  });

  test("on a Russian post, the Blog link stays in Russian with English stored", async ({ page }) => {
    await storeLocale(page, "en");
    await page.goto("/blog/ru/rag-breaks-earlier-than-people-think");
    await hydrated(page);
    await expect(primaryNav(page).getByRole("link").filter({ hasText: "blog" })).toHaveAttribute("href", "/blog/ru");
  });
});

test.describe("hero name", () => {
  test("the h1 has no reveal ancestor, so it paints at once", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#hero-heading").locator("xpath=ancestor-or-self::*[@data-reveal]")).toHaveCount(0);
  });

  for (const locale of ["en", "ru"] as const) {
    for (const width of [320, 375]) {
      test(`no horizontal overflow at ${width}px in ${locale}`, async ({ page }) => {
        await storeLocale(page, locale);
        await page.setViewportSize({ width, height: 800 });
        await page.goto("/");
        await expect(page.locator("html")).toHaveAttribute("data-locale", locale);
        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
      });
    }
  }
});

test("the static home sections ship no island", async ({ page }) => {
  await page.goto("/");
  for (const name of ["about", "links", "projects", "experience", "blog"]) {
    await expect(page.locator(`[data-section-name="${name}"]`)).toBeAttached();
    await expect(page.locator(`[data-section-name="${name}"] astro-island`)).toHaveCount(0);
  }
});
