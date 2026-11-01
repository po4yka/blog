import { test, expect } from "@playwright/test";

const PAGES = [
  "/",
  "/blog",
  "/blog/network-isnt-broken-just-here",
  "/blog/ru",
  "/projects",
  "/experience",
  "/settings",
  "/privacy",
];

test.describe("Static pages run under a hash-based script-src", () => {
  for (const path of PAGES) {
    test(`${path} has no CSP violations`, async ({ page }) => {
      const violations: string[] = [];
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (e) => {
          const w = window as unknown as { __csp?: string[] };
          (w.__csp ??= []).push(`${e.violatedDirective} ${e.blockedURI}`);
        });
      });

      const response = await page.goto(path);
      await page.waitForLoadState("networkidle");

      const csp = response?.headers()["content-security-policy"] ?? "";
      const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
      expect(scriptSrc).toContain("'sha256-");
      expect(scriptSrc).not.toContain("'unsafe-inline'");

      violations.push(...((await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp)) ?? []));
      expect(violations).toEqual([]);
      expect(errors.filter((e) => /Content Security Policy/i.test(e))).toEqual([]);
    });
  }

  test("theme toggle still hydrates and applies under the policy", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "light", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/\blight\b/);
  });
});
