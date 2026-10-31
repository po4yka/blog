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

interface ParentNode {
  children?: unknown[];
}

// Descends through every node with children, not only elements: in MDX, content wrapped in a JSX
// component is an mdxJsxFlowElement/mdxJsxTextElement whose children would otherwise be skipped.
function walk(node: ParentNode, fn: (el: Element) => void): void {
  for (const child of node.children ?? []) {
    const n = child as { type: string } & ParentNode;
    if (n.type === "element") fn(n as unknown as Element);
    walk(n, fn);
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

// remark-rehype labels the notes section and each backref in English. Posts under /blog/ru/ get Russian labels.
export function rehypeFootnoteLabels() {
  return (tree: Root, file: { path?: string }) => {
    if (!file.path?.replaceAll("\\", "/").includes("/blog/ru/")) return;
    walk(tree, (el) => {
      if (el.tagName === "h2" && el.properties.id === "footnote-label") {
        for (const child of el.children) if (child.type === "text") child.value = "Сноски";
      }
      const label = el.properties.ariaLabel;
      if (el.tagName === "a" && el.properties.dataFootnoteBackref !== undefined && typeof label === "string") {
        el.properties.ariaLabel = label.replace(/^Back to reference /, "Назад к ссылке ");
      }
    });
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
