import { test, expect, type Page } from "@playwright/test";
import { installVtRecorder, readVt, readVtCalls, supportsVt } from "./helpers/viewTransitions";

test.describe("navigation", () => {
  test("nav links navigate to correct pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();

    // Click "blog" nav link and verify navigation
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "blog" }).click();
    await expect(page).toHaveURL(/\/blog\/?$/);
    await expect(page).toHaveTitle(/Blog — Nikita Pochaev/);

    // Click "projects" nav link
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "projects" }).click();
    await expect(page).toHaveURL(/\/projects\/?$/);
    await expect(page).toHaveTitle(/Projects — Nikita Pochaev/);

    // Click "experience" nav link
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "experience" })
      .click();
    await expect(page).toHaveURL(/\/experience\/?$/);
    await expect(page).toHaveTitle(/Experience — Nikita Pochaev/);

    // Click "settings" nav link
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "settings" }).click();
    await expect(page).toHaveURL(/\/settings\/?$/);
    await expect(page).toHaveTitle(/Settings — Nikita Pochaev/);

    // Click "home" nav link to return
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "home" }).click();
    await expect(page).toHaveURL("/");
    await expect(page).toHaveTitle(/Nikita Pochaev/);
  });

  test("nav is present on all pages", async ({ page }) => {
    const routes = ["/", "/blog", "/projects", "/experience", "/settings"];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
      // Logo/home link with "po4yka" text is in the nav
      await expect(
        page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: /po4yka/ })
      ).toBeVisible();
    }
  });

  test("browser back button works after navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Nikita Pochaev/);

    // Navigate to blog
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "blog" }).click();
    await expect(page).toHaveURL(/\/blog\/?$/);

    // Navigate to projects
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "projects" }).click();
    await expect(page).toHaveURL(/\/projects\/?$/);

    // Go back to blog list
    await page.goBack();
    await expect(page).toHaveURL(/\/blog\/?$/);

    // Go back to homepage
    await page.goBack();
    await expect(page).toHaveURL("/");
  });
});

const STORAGE_KEY = "site_preferences";
const listRow = (page: Page) => page.locator("a:has(h2.display-serif)").first();

/** Open the first blog post from the list and return its slug. */
async function openFirstPost(page: Page): Promise<string> {
  await page.goto("/blog/");
  await page.getByRole("button", { name: "All" }).waitFor({ state: "visible" });
  const href = (await listRow(page).getAttribute("href")) ?? "";
  await listRow(page).click();
  await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === href.replace(/\/$/, ""));
  await expect(page.locator("article > header > h1")).toBeVisible();
  return href.replace(/\/$/, "").split("/").pop() ?? "";
}

test.describe("page transitions", () => {
  test.beforeEach(async ({ page }) => {
    await installVtRecorder(page);
  });

  test("list to post runs the root, title and body transitions within 300 ms", async ({ page }) => {
    const slug = await openFirstPost(page);
    // Without the API, openFirstPost completing is the whole fallback check.
    if (!(await supportsVt(page))) return;
    await expect.poll(async () => (await readVt(page)).length).toBeGreaterThan(0);
    const anims = await readVt(page);
    const pseudos = anims.map((a) => a.pseudo);
    expect(slug).not.toBe("");
    // Read the name the page really uses, so the test does not copy the naming rule.
    const titleName = await page.locator("article > header > h1").evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(pseudos).toContain(`::view-transition-group(${titleName})`);
    expect(pseudos).toContain("::view-transition-group(root)");
    // blog-content exists only on the post page, so it has a new image and no group.
    expect(pseudos).toContain("::view-transition-new(blog-content)");
    for (const a of anims) expect(Number(a.duration) + a.delay).toBeLessThanOrEqual(300);
  });

  // Named transition:persist keeps the island node across navigations; Astro passes the new props
  // (an unnamed persist hashes the props, so islands with a `pathname` prop used to remount).
  test("persisted islands keep their node and take the new route", async ({ page }) => {
    await page.goto("/blog/");
    await page.getByRole("button", { name: "All" }).waitFor({ state: "visible" });
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
    await page.evaluate(() => {
      const w = window as unknown as Record<string, Element | null>;
      w.__nav = document.querySelector("nav");
      w.__status = document.querySelector("astro-island[component-url*='StatusLine']");
      w.__footer = document.querySelector("footer");
    });
    const href = (await listRow(page).getAttribute("href")) ?? "";
    await listRow(page).click();
    await expect(page.locator("article > header > h1")).toBeVisible();
    const same = await page.evaluate(() => {
      const w = window as unknown as Record<string, Element | null>;
      return {
        nav: w.__nav === document.querySelector("nav"),
        status: w.__status === document.querySelector("astro-island[component-url*='StatusLine']"),
        footer: w.__footer === document.querySelector("footer"),
      };
    });
    expect(same).toEqual({ nav: true, status: true, footer: true });
    // The kept StatusLine shows the new path, so the props did reach it.
    const path = href.replace(/\/$/, "");
    await expect(page.locator("astro-island[component-url*='StatusLine']")).toContainText(path.split("/").pop() ?? "");
  });

  test("view-transition-name is unique on both blog lists", async ({ page }) => {
    for (const path of ["/blog/", "/blog/ru/"]) {
      await page.goto(path);
      const names = await page.evaluate(() =>
        [...document.querySelectorAll("*")]
          .map((el) => getComputedStyle(el).viewTransitionName)
          .filter((n) => n && n !== "none"),
      );
      expect(names.length).toBeGreaterThan(0);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  test.describe("OS reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("list to post runs no view-transition animation", async ({ page }) => {
      await openFirstPost(page);
      await page.waitForTimeout(400);
      if (await supportsVt(page)) expect(await readVtCalls(page)).toBeGreaterThan(0);
      expect((await readVt(page)).filter((a) => a.name !== "none")).toEqual([]);
    });
  });

  test("stored reduced-motion flag runs no view-transition animation", async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({ state: { reduceMotion: true }, version: 3 }));
    }, STORAGE_KEY);
    await openFirstPost(page);
    await page.waitForTimeout(400);
    if (await supportsVt(page)) expect(await readVtCalls(page)).toBeGreaterThan(0);
    expect((await readVt(page)).filter((a) => a.name !== "none")).toEqual([]);
  });
});
