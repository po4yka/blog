import { test, expect } from "@playwright/test";

function setupConsoleCapture(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

function expectNoRelevantConsoleErrors(errors: string[]): void {
  const nonCspErrors = errors.join("\n").replace(/^.*Content Security Policy.*$/gim, "").trim();
  expect(nonCspErrors).toBe("");
}

function expectNoHydrationErrors(errors: string[]): void {
  expect(errors.join("\n").toLowerCase()).not.toMatch(
    /hydration|did not match|text content mismatch/,
  );
}

test.describe("React island hydration", () => {
  test("homepage loads without console errors", async ({ page }) => {
    const errors = setupConsoleCapture(page);

    await page.goto("/");
    // Wait for page to fully settle
    await page.waitForLoadState("networkidle");

    expectNoRelevantConsoleErrors(errors);
  });

  test("no hydration mismatch errors on homepage", async ({ page }) => {
    const errors = setupConsoleCapture(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expectNoHydrationErrors(errors);
  });

  test("blog list island becomes interactive", async ({ page }) => {
    const errors = setupConsoleCapture(page);

    await page.goto("/blog");
    await page.waitForLoadState("networkidle");

    // Category filter buttons should be clickable after hydration
    const allBtn = page.getByRole("button", { name: "All" });
    await expect(allBtn).toBeVisible();
    // Clicking "All" should work without errors (verifies island hydration)
    await allBtn.click();

    expectNoHydrationErrors(errors);
  });

  test("settings island becomes interactive", async ({ page }) => {
    const errors = setupConsoleCapture(page);

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Theme toggle buttons should be visible and clickable
    const lightBtn = page.getByRole("button", { name: "light", exact: true });
    await expect(lightBtn).toBeVisible();
    await lightBtn.click();

    // Verify it responded -- html should have "light" class
    await expect(page.locator("html")).toHaveClass(/\blight\b/);

    expectNoHydrationErrors(errors);
  });

});
