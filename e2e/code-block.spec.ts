import { test, expect } from "@playwright/test";

const POST = "/blog/network-isnt-broken-just-here";

test("the static HTML has the code block header and a copy button", async ({ request }) => {
  const html = await (await request.get(POST)).text();
  expect(html).toContain('<span class="code-block-lang">text</span>');
  expect(html).toMatch(
    /<button type="button" class="code-block-copy" data-copy-code(="")? aria-label="Copy code" data-copied-text="copied" data-copied-label="Copied">copy<\/button>/,
  );
  expect(html).toMatch(/<pre class="astro-code[^"]*"[^>]*tabindex="0"/);
});

test("the copy button writes the code, without line numbers, to the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(POST);
  await expect(page.locator("astro-island:has(.prose-blog)")).not.toHaveAttribute("ssr", { timeout: 10_000 });

  const block = page.locator(".code-block").first();
  // Line numbers are a CSS counter; turn the gutter on to prove it stays out of the copy.
  await block.locator("pre").evaluate((pre) => pre.setAttribute("data-line-numbers", ""));
  const gutter = await block
    .locator(".line")
    .first()
    .evaluate((line) => getComputedStyle(line, "::before").content);
  expect(gutter).toContain("counter(line)");

  const expected = await block.locator("pre code").evaluate((code) => code.textContent);
  const button = block.getByRole("button", { name: "Copy code" });
  await button.click();
  await expect(block.getByRole("button", { name: "Copied" })).toHaveText("copied");

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(expected);
  expect(copied.startsWith("tcp_fat_header_ok")).toBe(true);
  expect(copied).not.toMatch(/^\s*\d/m);
  expect(copied).not.toContain("copy");
});
