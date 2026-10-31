import { test, expect } from "@playwright/test";

test("the 404 static HTML lists every real route, post and project", async ({ request }) => {
  const res = await request.get("/no-such-page-at-all/");
  expect(res.status()).toBe(404);
  const html = await res.text();
  for (const href of ["/projects/", "/experience/", "/blog/", "/changelog/", "/blog/rag-breaks-earlier-than-people-think/", "/blog/ru/network-isnt-broken-just-here/"]) {
    expect(html).toContain(`href="${href}"`);
  }
  expect(html).toMatch(/href="\/projects\/#[\w-]+"/);
});

test("a near-miss path puts the closest real route first", async ({ page }) => {
  const res = await page.goto("/blog/rag-breaks/");
  expect(res?.status()).toBe(404);
  const closest = page.locator("section", { has: page.getByRole("heading", { name: "Closest match" }) });
  await expect(closest.getByRole("link").first()).toHaveAttribute("href", "/blog/rag-breaks-earlier-than-people-think/");
  await expect(page.getByText(/^\/blog\/rag-breaks\/?$/)).toBeVisible();
});

test("an unrelated path suggests nothing and still offers the way home", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/wp-admin/setup.php");
  await expect(page.getByText("/wp-admin/setup.php", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Closest match" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Go home" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
