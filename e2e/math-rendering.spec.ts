import { test, expect } from "@playwright/test";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const cssPath = require.resolve("katex/dist/katex.min.css");
const css = readFileSync(cssPath, "utf8").replaceAll("url(fonts/", "url(/__math_fixture/fonts/");
const processor = unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] });

for (const width of [375, 1280]) {
  test(`Astro equations retain layout with matching CSS at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    // Intercept fixture fonts locally: no CDN, external upload, or production route.
    await page.route("**/__math_fixture/fonts/*", async (route) => {
      const font = path.basename(new URL(route.request().url()).pathname);
      await route.fulfill({ body: readFileSync(path.join(path.dirname(cssPath), "fonts", font)) });
    });
    await page.goto("/blog");
    const renderer = await processor.createRenderer({ syntaxHighlight: false });
    const { code } = await renderer.render("Inline $x^2$.\n\n$$\n\\frac{a}{b} + \\sqrt{x}\n$$");
    // Use the real Astro pipeline and the same installed stylesheet as both blog locales.
    await page.setContent(`<style>${css}</style><main style="padding:16px">${code}</main>`);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => [...document.fonts].filter((font) => font.status === "error").map((font) => font.family))).toEqual([]);
    await expect(page.locator(".katex")).toHaveCount(2);
    await expect(page.locator(".katex-error")).toHaveCount(0);
    await expect(page.locator(".katex-base").first()).toHaveCSS("display", "inline-block");
    await expect(page.locator(".katex-strut").first()).toHaveCSS("display", "inline-block");
    await expect(page.locator(".katex-mathml").first()).toHaveCSS("position", "absolute");
    const numerator = await page.locator(".mfrac .mathnormal").filter({ hasText: /^a$/ }).boundingBox();
    const denominator = await page.locator(".mfrac .mathnormal").filter({ hasText: /^b$/ }).boundingBox();
    expect(numerator).not.toBeNull();
    expect(denominator).not.toBeNull();
    expect(numerator!.y + numerator!.height / 2).toBeLessThan(denominator!.y);
    expect(await page.locator(".frac-line").evaluate((el) => parseFloat(getComputedStyle(el).borderBottomWidth))).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
