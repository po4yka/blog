import { test, expect } from "@playwright/test";

test.describe("Blog list page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blog");
    // Wait for the BlogListIsland to hydrate -- category filter buttons become visible
    await page.getByRole("button", { name: "All" }).waitFor({ state: "visible" });
  });

  test("shows blog posts when published", async ({ page }) => {
    // At least one post should be visible
    await expect(page.locator("a[href*='/blog/']").first()).toBeVisible();
  });

  test("category filter buttons are available", async ({ page }) => {
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  });
});

test.describe("Blog post structure", () => {
  const POST = "/blog/rag-breaks-earlier-than-people-think/";

  test("keeps article > header > h1 + time in the static HTML", async ({ page, request }) => {
    // No JavaScript: this is what crawlers see.
    const html = await (await request.get(POST)).text();
    expect(html).toMatch(/<article[^>]*>\s*<header[^>]*>\s*<h1/);

    await page.goto(POST);
    await expect(page.locator("article > header > h1")).toHaveCount(1);
    await expect(page.locator("article > header time[datetime]").first()).toBeAttached();
  });
});
