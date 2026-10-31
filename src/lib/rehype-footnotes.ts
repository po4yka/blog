// Build-time support for footnotes and math on blog posts.
//
// remark-gfm already emits one <li> per note inside <section data-footnotes>.
// `rehypeFootnotes` keeps that single node and only adds a unique CSS anchor
// pair (reference -> note), so prose.css can place the note beside its
// reference in the margin; the same node opens as a popover on narrow screens
// (FootnotePopover.astro). Nothing is duplicated.
//
// `rehypeMathFlag` records whether rehype-katex produced math, so the post
// page loads the KaTeX stylesheet only for posts that need it.

import type { Element, Root } from "hast";

type Parent = Root | Element;

function walk(node: Parent, fn: (el: Element) => void): void {
  for (const child of node.children) {
    if (child.type !== "element") continue;
    fn(child);
    walk(child, fn);
  }
}

function hasClass(el: Element, name: string): boolean {
  const cls = el.properties.className;
  return Array.isArray(cls) && cls.includes(name);
}

function appendStyle(el: Element, rule: string): void {
  const prev = typeof el.properties.style === "string" ? el.properties.style : "";
  el.properties.style = prev ? `${prev};${rule}` : rule;
}

export function rehypeFootnotes() {
  return (tree: Root) => {
    const refs: Element[] = [];
    const notes = new Map<string, Element>();
    walk(tree, (el) => {
      if (el.tagName === "a" && el.properties.dataFootnoteRef !== undefined) refs.push(el);
      if (el.tagName === "li" && typeof el.properties.id === "string") notes.set(el.properties.id, el);
    });
    let n = 0;
    const seen = new Set<string>();
    for (const ref of refs) {
      const href = ref.properties.href;
      const id = typeof href === "string" ? href.slice(1) : "";
      const note = notes.get(id);
      // A note cited twice is anchored to its first reference only.
      if (!note || seen.has(id)) continue;
      seen.add(id);
      n += 1;
      appendStyle(ref, `anchor-name:--fn-${n}`);
      appendStyle(note, `position-anchor:--fn-${n}`);
    }
  };
}

interface AstroFileData {
  astro?: { frontmatter?: Record<string, unknown> };
}

export function rehypeMathFlag() {
  return (tree: Root, file: { data: AstroFileData }) => {
    let hasMath = false;
    walk(tree, (el) => {
      if (hasClass(el, "katex")) hasMath = true;
    });
    const astro = (file.data.astro ??= {});
    (astro.frontmatter ??= {}).hasMath = hasMath;
  };
}
