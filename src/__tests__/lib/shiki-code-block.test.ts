import { describe, expect, it } from "vitest";
import { unified } from "@astrojs/markdown-remark";
import { transformerNotationDiff, transformerNotationHighlight } from "@shikijs/transformers";
import { monoDark, monoLight } from "@/lib/shiki-mono";
import { parseCodeMeta, rehypeCodeCopyLabel, transformerCodeBlock } from "@/lib/shiki-code-block";
import { stripMdxSyntax } from "@/lib/blog/mdx-text";

// Same Shiki setup as astro.config.mjs, run through Astro's own Markdown renderer.
const renderer = unified({ rehypePlugins: [rehypeCodeCopyLabel] }).createRenderer({
  syntaxHighlight: "shiki",
  shikiConfig: {
    themes: { light: monoLight, dark: monoDark },
    defaultColor: false,
    transformers: [transformerNotationHighlight(), transformerNotationDiff(), transformerCodeBlock()],
  },
});

const render = async (source: string, path = "/repo/src/content/blog/en/post.mdx") =>
  (await (await renderer).render(source, { fileURL: new URL(`file://${path}`) })).code;

// Repeat until stable so no tag survives a nested match.
const text = (html: string) => {
  let prev;
  do {
    prev = html;
    html = html.replace(/<[^>]*>/g, "");
  } while (html !== prev);
  return html;
};

describe("parseCodeMeta", () => {
  it.each([
    ['title="src/app.ts"', "src/app.ts"],
    ["title='a b.kt' showLineNumbers", "a b.kt"],
    ["title=build.gradle", "build.gradle"],
    ["", undefined],
    ['title=""', undefined],
  ])("reads the filename from %j", (meta, title) => {
    expect(parseCodeMeta(meta).title).toBe(title);
  });

  it("reads the line-number flag", () => {
    expect(parseCodeMeta("showLineNumbers").lineNumbers).toBe(true);
    expect(parseCodeMeta('title="x" showLineNumbers').lineNumbers).toBe(true);
    expect(parseCodeMeta("showLineNumbersX").lineNumbers).toBe(false);
    expect(parseCodeMeta('title="a showLineNumbers b"').lineNumbers).toBe(false);
  });
});

describe("transformerCodeBlock", () => {
  it("wraps the pre in a panel with the language label and a copy button", async () => {
    const html = await render("```ts\nconst a = 1;\n```");
    expect(html).toMatch(/^<div class="code-block"><div class="code-block-head">/);
    expect(html).toContain('<span class="code-block-lang">ts</span>');
    expect(html).toContain('<button type="button" class="code-block-copy" data-copy-code="" aria-label="Copy code">copy</button>');
    expect(html).not.toContain("code-block-file");
    expect(html).not.toContain("data-line-numbers");
    // Shiki keeps the scrollable pre keyboard-focusable
    expect(html).toMatch(/<pre class="astro-code[^"]*"[^>]*tabindex="0"/);
  });

  it("shows the filename and turns on line numbers from the fence meta", async () => {
    const html = await render('```kotlin title="Main.kt" showLineNumbers\nfun main() {}\n```');
    expect(html).toContain('<span class="code-block-file">Main.kt</span><span class="code-block-lang">kotlin</span>');
    expect(html).toMatch(/<pre [^>]*data-line-numbers=""/);
  });

  it("labels an unmarked fence as text", async () => {
    expect(await render("```\nplain\n```")).toContain('<span class="code-block-lang">text</span>');
  });

  it("localizes the copy label on Russian posts", async () => {
    const html = await render("```sh\nls\n```", "/repo/src/content/blog/ru/post.mdx");
    expect(html).toContain('aria-label="Копировать код"');
  });

  it("marks diff and highlighted lines and removes the notation from the code", async () => {
    const html = await render(
      "```ts\nconst a = 1; // [!code --]\nconst a = 2; // [!code ++]\nconst b = 3; // [!code highlight]\n```",
    );
    expect(html).toMatch(/<pre class="astro-code[^"]* has-highlighted has-diff"/);
    expect(html).toContain('class="line diff remove"');
    expect(html).toContain('class="line diff add"');
    expect(html).toContain('class="line highlighted"');
    const code = text(html.slice(html.indexOf("<pre")));
    expect(code).toBe("const a = 1;\nconst a = 2;\nconst b = 3;");
  });
});

describe("stripMdxSyntax", () => {
  it("removes Shiki notation comments from the plain-text endpoints", () => {
    const source = [
      '```ts title="a.ts"',
      "const a = 1; // [!code --]",
      "const a = 2; // [!code ++]",
      "# [!code highlight:2]",
      "x = 1 # [!code highlight]",
      "```",
    ].join("\n");
    expect(stripMdxSyntax(source)).toBe(['```ts title="a.ts"', "const a = 1;", "const a = 2;", "x = 1", "```"].join("\n"));
  });

  it("keeps the notation in prose and handles -- comments", () => {
    const source = ["Mark a line with `// [!code ++]`.", "", "```sql", "SELECT 1; -- [!code highlight]", "```"].join("\n");
    expect(stripMdxSyntax(source)).toBe(["Mark a line with `// [!code ++]`.", "", "```sql", "SELECT 1;", "```"].join("\n"));
  });
});
