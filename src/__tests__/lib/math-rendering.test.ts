import { describe, expect, it } from "vitest";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import katex from "katex";
import { micromark } from "micromark";
import { math, mathHtml } from "micromark-extension-math";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const css = readFileSync(require.resolve("katex/dist/katex.min.css"), "utf8");
const processor = unified({
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
});
const renderer = processor.createRenderer({ syntaxHighlight: false });

// Exercise Astro's actual Markdown renderer, not just KaTeX's direct API.
describe("Astro math rendering compatibility", () => {
  it("uses the same KaTeX for both transitive renderers and the page CSS", () => {
    for (const consumer of ["rehype-katex", "micromark-extension-math"]) {
      const consumerRequire = createRequire(require.resolve(consumer));
      expect(consumerRequire.resolve("katex")).toBe(require.resolve("katex"));
    }
    const lock = JSON.parse(readFileSync(new URL("../../../package-lock.json", import.meta.url), "utf8"));
    expect(katex.version).toBe(lock.packages["node_modules/katex"].version);
    expect(css).toContain(".katex-base");
    expect(css).toContain(".katex-strut");
  });

  it.each([
    ["inline", "$x^2 + y^2 = z^2$", false],
    ["display", "$$\n\\frac{a}{b} + \\sqrt{x}\n$$", true],
    ["fenced", "```math\n\\sum_{i=1}^{n} i\n```", true],
    ["aligned", "$$\n\\begin{aligned}a&=b\\\\c&=d\\end{aligned}\n$$", true],
  ])("renders %s formulas with matching prefixed CSS and accessible MathML", async (_, source, display) => {
    const { code } = await (await renderer).render(source);
    expect(code).toContain('class="katex-base"');
    expect(code).toContain('class="katex-strut"');
    expect(code).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML"');
    expect(code).toContain('aria-hidden="true"');
    expect(code.includes('class="katex-display"')).toBe(display);
    expect(code).not.toContain("katex-error");
    expect(code).not.toContain("language-math");
  });

  it("compiles MDX blog formulas through Astro's MDX pipeline", async () => {
    const mdx = await processor.createMdxRenderer!({ syntaxHighlight: false }, { optimize: false });
    const { code } = await mdx.process("Inline $x^2$.\n\n$$\n\\frac{a}{b}\n$$", "/tmp/math-fixture.mdx", {});
    expect(code).toContain('class: "katex-base"');
    expect(code).toContain('class: "katex-display"');
    expect(code).toContain('xmlns: "http://www.w3.org/1998/Math/MathML"');
    expect(code).not.toContain("katex-error");
  });

  it("keeps the micromark HTML extension compatible with the overridden renderer", () => {
    const code = micromark("$x^2$", { extensions: [math()], htmlExtensions: [mathHtml()] });
    expect(code).toContain('class="katex-base"');
    expect(code).toContain("<math");
    expect(code).not.toContain("katex-error");
  });

  it("keeps malformed input readable without crashing the pipeline", async () => {
    const { code } = await (await renderer).render("$\\notARealMathCommand{x}$");
    expect(code).toContain("notARealMathCommand");
    expect(code).not.toContain("<script");
  });

  it("does not enable trusted HTML commands", async () => {
    const { code } = await (await renderer).render(String.raw`$\href{javascript:alert(1)}{click}$`);
    expect(code).not.toContain('href="javascript:');
    expect(code).not.toContain("<a ");
  });
});
