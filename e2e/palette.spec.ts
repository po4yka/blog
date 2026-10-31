import { test, expect, type Page } from "@playwright/test";

const STORAGE_KEY = "site_preferences";
const CHUNK = /CommandPalette/;

const dialog = (page: Page) => page.getByRole("dialog", { name: /command palette|палитра команд/i });
const input = (page: Page) => page.getByRole("combobox");
const navButton = (page: Page) => page.getByRole("button", { name: /^(command palette|палитра команд)$/i }).first();

async function storePrefs(page: Page, state: Record<string, unknown>) {
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, JSON.stringify({ state: value, version: 3 })),
    [STORAGE_KEY, state] as const,
  );
}

/** The islands must be hydrated before a shortcut or click can work. */
async function ready(page: Page, path = "/") {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

test.describe("Command palette", () => {
  test("requests no palette chunk before the first interaction", async ({ page }) => {
    const requested: string[] = [];
    page.on("request", (r) => {
      if (CHUNK.test(r.url())) requested.push(r.url());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    expect(requested).toEqual([]);
  });

  test("Ctrl+K opens it, with the combobox and listbox attributes", async ({ page }) => {
    await ready(page);
    await page.keyboard.press("Control+k");
    await expect(dialog(page)).toBeVisible();
    const box = input(page);
    await expect(box).toBeFocused();
    await expect(box).toHaveAttribute("aria-expanded", "true");
    const listId = await box.getAttribute("aria-controls");
    expect(listId).toBeTruthy();
    const list = page.locator(`[id="${listId}"]`);
    await expect(list).toHaveAttribute("role", "listbox");
    const options = list.getByRole("option");
    expect(await options.count()).toBeGreaterThan(5);
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    const activeId = await box.getAttribute("aria-activedescendant");
    await expect(page.locator(`[id="${activeId}"]`)).toHaveAttribute("role", "option");
    // Group names and the typed command are shown.
    await expect(dialog(page).getByText("Pages", { exact: true })).toBeVisible();
    await expect(dialog(page).getByText("open projects", { exact: true })).toBeVisible();
  });

  test("the nav button opens it, and Esc closes it and returns focus to the button", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await ready(page);
    const button = navButton(page);
    await button.click();
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("the mobile menu has an opener", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await ready(page);
    await page.getByRole("button", { name: /menu/i }).click();
    await page.getByRole("button", { name: /command palette/i }).click();
    await expect(dialog(page)).toBeVisible();
  });

  test("typing filters the rows and updates the live count", async ({ page }) => {
    await ready(page);
    await page.keyboard.press("Control+k");
    const status = dialog(page).getByRole("status");
    const before = await status.textContent();
    await input(page).fill("theme dark");
    await expect(status).not.toHaveText(before ?? "");
    await expect(status).toHaveText("Results: 1");
    await expect(dialog(page).getByRole("option")).toHaveCount(1);
    await input(page).fill("zzzzqqqq");
    await expect(status).toHaveText("Results: 0");
    await expect(dialog(page).getByText("No matches")).toBeVisible();
    await expect(dialog(page).getByRole("option")).toHaveCount(0);
  });

  test("ArrowDown then Enter on a post navigates to it", async ({ page }) => {
    await ready(page);
    await page.keyboard.press("Control+k");
    await input(page).fill("open ");
    const posts = dialog(page).getByRole("group", { name: "Posts" });
    const first = posts.getByRole("option").first();
    const command = (await first.locator("span").nth(1).innerText()).split(" · ")[0] ?? "";
    const slug = command.replace(/^open /, "");
    // Move the active option down to the first post row, then run it.
    const pageCount = await dialog(page).getByRole("group", { name: "Pages" }).getByRole("option").count();
    for (let i = 0; i < pageCount; i++) await page.keyboard.press("ArrowDown");
    await expect(first).toHaveAttribute("aria-selected", "true");
    await Promise.all([page.waitForURL(new RegExp(`/blog/(ru/)?${slug}/?$`)), page.keyboard.press("Enter")]);
  });

  test("the theme row changes the theme", async ({ page }) => {
    await storePrefs(page, { theme: "light" });
    await ready(page);
    await page.keyboard.press("Control+k");
    await input(page).fill("theme dark");
    await page.keyboard.press("Enter");
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  });

  test("with single-key shortcuts off, / does nothing but Ctrl+K still opens it", async ({ page }) => {
    await storePrefs(page, { keyboardShortcuts: false });
    await ready(page);
    await page.keyboard.press("/");
    await page.waitForTimeout(600);
    await expect(page.locator("#terminal-input")).not.toBeFocused();
    await expect(dialog(page)).toBeHidden();
    await page.keyboard.press("Control+k");
    await expect(dialog(page)).toBeVisible();
  });

  test("shows Russian labels in the RU locale", async ({ page }) => {
    await storePrefs(page, { locale: "ru" });
    await ready(page);
    await page.keyboard.press("Control+k");
    await expect(dialog(page)).toBeVisible();
    await expect(input(page)).toHaveAttribute("placeholder", "Введите команду или запрос");
    await expect(dialog(page).getByText("Страницы", { exact: true })).toBeVisible();
    await expect(dialog(page).getByRole("status")).toContainText("Результатов:");
  });

  test("opens without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await ready(page);
    await page.keyboard.press("Control+k");
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    expect(errors).toEqual([]);
  });
});
