import { test, expect, type Page } from "@playwright/test";

// The four static home sections (Links, Projects, Experience, Blog) render both
// languages in the HTML; html[data-locale], set before paint, shows one. Text is
// read with innerText, which skips the hidden (display: none) language.

const STORAGE_KEY = "site_preferences";
const RU_PROJECTS = "Избранные проекты";
const EN_PROJECTS = "Selected Projects";

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
    expect(await page.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument)).toBe(true);
  });
});

test("the four static sections ship no island", async ({ page }) => {
  await page.goto("/");
  for (const name of ["links", "projects", "experience", "blog"]) {
    await expect(page.locator(`[data-section-name="${name}"]`)).toBeAttached();
    await expect(page.locator(`[data-section-name="${name}"] astro-island`)).toHaveCount(0);
  }
});
