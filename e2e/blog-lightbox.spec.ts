import { test, expect } from "@playwright/test";

const POST_URL = "/blog/rag-breaks-earlier-than-people-think";

test.describe("blog image lightbox", () => {
  test("opens from shared figure URL, navigates, and closes cleanly", async ({ page }) => {
    await page.goto(`${POST_URL}?fig=2`);
    await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("02 / 03")).toBeVisible();

    await page.getByRole("button", { name: "Next image" }).click();
    await expect(page).toHaveURL(/fig=3/);
    await expect(page.getByText("03 / 03")).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeHidden();
    await expect(page).not.toHaveURL(/fig=/);
  });

  test("opens from an article image with thumbnail navigation", async ({ page }) => {
    await page.goto(POST_URL);
    const imageButton = page.getByRole("button", { name: /Open image:/ }).first();
    await expect(imageButton).toBeVisible();

    await imageButton.click();
    await expect(page.getByRole("dialog", { name: "Image viewer" })).toBeVisible();
    await expect(page).toHaveURL(/fig=1/);
    await expect(page.getByRole("tablist", { name: "Figures" })).toBeVisible();

    await page.getByRole("tab", { name: "Go to figure 2" }).click();
    await expect(page).toHaveURL(/fig=2/);
    await expect(page.getByText("02 / 03")).toBeVisible();
  });
});
