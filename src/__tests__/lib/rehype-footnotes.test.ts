import { describe, expect, it } from "vitest";
import { unified } from "@astrojs/markdown-remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Root } from "hast";
import { rehypeFootnoteLabels, rehypeFootnotes, rehypeMathFlag } from "@/lib/rehype-footnotes";

const renderer = unified({
  remarkPlugins: [remarkGfm, remarkMath],
  rehypePlugins: [rehypeKatex, rehypeMathFlag, rehypeFootnotes],
}).createRenderer({ syntaxHighlight: false });

const SOURCE = "First claim[^a] and second[^b], first again[^a].\n\n[^a]: Note alpha text.\n[^b]: Note beta text.\n";

describe("rehypeFootnotes", () => {
  it("keeps one node per note and pairs each with a unique CSS anchor", async () => {
    const { code } = await (await renderer).render(SOURCE);
    expect(code.match(/<li id="user-content-fn-/g)).toHaveLength(2);
    expect(code.match(/Note alpha text/g)).toHaveLength(1);
    expect(code.match(/Note beta text/g)).toHaveLength(1);
    expect(code).toContain('href="#user-content-fn-a"');
    expect(code).toMatch(/<li id="user-content-fn-a" style="position-anchor:--fn-1">/);
    expect(code).toMatch(/<li id="user-content-fn-b" style="position-anchor:--fn-2">/);
    // two references to note a, but only the first one is the anchor
    expect(code.match(/anchor-name:--fn-1/g)).toHaveLength(1);
    expect(code.match(/anchor-name:--fn-2/g)).toHaveLength(1);
  });

  it("leaves posts without footnotes untouched", async () => {
    const { code } = await (await renderer).render("Plain paragraph.");
    expect(code).not.toContain("anchor");
  });
});

describe("rehypeMathFlag", () => {
  it("flags math in the post frontmatter and only then", async () => {
    const withMath = await (await renderer).render("Inline $x^2$.");
    const without = await (await renderer).render("No math here.");
    expect(withMath.metadata.frontmatter.hasMath).toBe(true);
    expect(without.metadata.frontmatter.hasMath).toBe(false);
  });
});

describe("walk through MDX JSX wrappers", () => {
  const katex = { type: "element", tagName: "span", properties: { className: ["katex"] }, children: [] };
  const wrapped = (inner: unknown) =>
    ({ type: "root", children: [{ type: "mdxJsxFlowElement", name: "Callout", children: [inner] }] }) as unknown as Root;

  it("sees math inside a JSX component", () => {
    const file = { data: {} as { astro?: { frontmatter?: Record<string, unknown> } } };
    rehypeMathFlag()(wrapped(katex), file);
    expect(file.data.astro?.frontmatter?.hasMath).toBe(true);
  });

  it("anchors a reference inside a JSX component", () => {
    const ref = { type: "element", tagName: "a", properties: { href: "#fn", dataFootnoteRef: "" }, children: [] };
    const note = { type: "element", tagName: "li", properties: { id: "fn" }, children: [] };
    rehypeFootnotes()(wrapped({ type: "element", tagName: "p", properties: {}, children: [ref, note] }));
    expect(ref.properties).toMatchObject({ style: "anchor-name:--fn-1" });
  });
});

describe("rehypeFootnoteLabels", () => {
  const tree = () =>
    ({
      type: "root",
      children: [
        { type: "element", tagName: "h2", properties: { id: "footnote-label" }, children: [{ type: "text", value: "Footnotes" }] },
        { type: "element", tagName: "a", properties: { dataFootnoteBackref: "", ariaLabel: "Back to reference 2" }, children: [] },
      ],
    }) as unknown as Root;

  it("translates the labels of Russian posts only", () => {
    const ru = tree();
    rehypeFootnoteLabels()(ru, { path: "/repo/src/content/blog/ru/post.mdx" });
    expect(JSON.stringify(ru)).toContain("Сноски");
    expect(JSON.stringify(ru)).toContain("Назад к ссылке 2");
    const en = tree();
    rehypeFootnoteLabels()(en, { path: "/repo/src/content/blog/en/post.mdx" });
    expect(JSON.stringify(en)).toContain("Footnotes");
    expect(JSON.stringify(en)).toContain("Back to reference 2");
  });
});
