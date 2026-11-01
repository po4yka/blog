import { test, expect } from "@playwright/test";
import { unified } from "@astrojs/markdown-remark";
import remarkGfm from "remark-gfm";
import { transform } from "esbuild";
import { readFileSync } from "node:fs";
import { rehypeFootnotes } from "../src/lib/rehype-footnotes";

// No post uses footnotes yet, so the fixture is rendered with the real rehype
// plugin, the real prose.css and the real popover script, without a route.
const css = readFileSync("src/styles/prose.css", "utf8");
const astroSource = readFileSync("src/components/blog/FootnotePopover.astro", "utf8");
const script = astroSource.slice(astroSource.indexOf("<script>") + 8, astroSource.indexOf("</script>"));
// The fixture injects the popover script inline; the site's CSP (no 'unsafe-inline') would block it.
// Production ships that script as a bundled same-origin file, which the CSP allows.
test.use({ bypassCSP: true });

const SOURCE = `Opening paragraph with a claim[^a] and another[^b].\n\n${"Filler paragraph. ".repeat(20)}\n\n[^a]: Note alpha text.\n[^b]: Note beta text.\n`;

async function load(page: import("@playwright/test").Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/blog");
  const renderer = await unified({ remarkPlugins: [remarkGfm], rehypePlugins: [rehypeFootnotes] }).createRenderer({
    syntaxHighlight: false,
  });
  const { code } = await renderer.render(SOURCE);
  const js = (await transform(script, { loader: "ts" })).code;
  await page.setContent(
    `<style>:root{--background:#fff;--foreground:#000;--border:#999;--muted-foreground:#444}body{margin:0}${css}</style>` +
      `<main style="padding:16px"><article class="blog-article"><div class="prose-blog">${code}</div></article></main>`,
  );
  // /blog's CSP blocks inline scripts (the built page loads this script as a file). page.evaluate
  // runs the fixture over DevTools, so the test keeps the real CSP for everything else on the page.
  await page.evaluate(js);
}

test("each footnote is one node in the DOM", async ({ page }) => {
  await load(page, 1280);
  await expect(page.locator("[data-footnotes] li")).toHaveCount(2);
  await expect(page.getByText("Note alpha text")).toHaveCount(1);
});

test("narrow screens open the note as a popover; Esc closes it and focus returns to the reference", async ({ page }) => {
  await load(page, 375);
  const ref = page.locator("a[data-footnote-ref]").first();
  const note = page.locator("[data-footnotes] li").first();
  await expect(note).toBeHidden();
  await ref.click();
  await expect(note).toBeVisible();
  await expect(note).toContainText("Note alpha text");
  await page.keyboard.press("Escape");
  await expect(note).toBeHidden();
  await expect(ref).toBeFocused();
});

test("wide screens place the note in the margin beside its reference", async ({ page }) => {
  await load(page, 1280);
  const ref = page.locator("a[data-footnote-ref]").first();
  const note = page.locator("[data-footnotes] li").first();
  test.skip(!(await page.evaluate(() => CSS.supports("anchor-name", "--a"))), "needs anchor positioning");
  await expect(note).toBeVisible();
  const prose = (await page.locator(".prose-blog").boundingBox())!;
  const noteBox = (await note.boundingBox())!;
  const refBox = (await ref.boundingBox())!;
  expect(noteBox.x).toBeGreaterThanOrEqual(prose.x + prose.width);
  expect(Math.abs(noteBox.y - refBox.y)).toBeLessThan(refBox.height + 4);
  await ref.click();
  await expect(note).toBeVisible();
  expect(await note.evaluate((el) => el.matches(":popover-open"))).toBe(false);
});
