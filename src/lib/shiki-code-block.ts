// Build-time chrome for blog code blocks.
//
// `transformerCodeBlock` wraps each highlighted <pre> in a flat panel with a
// header row: optional filename (fence meta `title="..."`), the language
// label, and a copy button. The button is static HTML; the blog island binds
// one delegated click handler (CodeBlockCopy.tsx). `showLineNumbers` in the
// fence meta turns on the CSS-counter gutter, so line numbers never enter the
// text content that crawlers read and the copy button writes.
//
// Shiki transformers do not see the source file, so `rehypeCodeCopyLabel`
// (a rehype plugin that runs after Shiki) sets the button's localized label
// from the post path.

import type { ShikiTransformer } from "shiki";
import type { Element, ElementContent, Root, RootContent } from "hast";
import { t, type Locale } from "./i18n";

const TITLE = /(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|(\S+))/;
const LINE_NUMBERS = /(?:^|\s)showLineNumbers(?:\s|$)/;

export function parseCodeMeta(raw = ""): { title?: string; lineNumbers: boolean } {
  const m = TITLE.exec(raw);
  const title = m ? (m[1] ?? m[2] ?? m[3]) : undefined;
  // test the flag outside the title, so `title="showLineNumbers.md"` stays a filename
  return { title: title || undefined, lineNumbers: LINE_NUMBERS.test(m ? raw.replace(m[0], " ") : raw) };
}

function span(className: string, text: string): Element {
  return { type: "element", tagName: "span", properties: { className: [className] }, children: [{ type: "text", value: text }] };
}

export function transformerCodeBlock(): ShikiTransformer {
  return {
    name: "po4yka:code-block",
    pre(node) {
      if (parseCodeMeta(this.options.meta?.__raw).lineNumbers) node.properties.dataLineNumbers = "";
    },
    root(root) {
      const { title } = parseCodeMeta(this.options.meta?.__raw);
      const lang = this.options.lang === "plaintext" ? "text" : String(this.options.lang);
      const head: ElementContent[] = [];
      if (title) head.push(span("code-block-file", title));
      head.push(span("code-block-lang", lang));
      head.push({
        type: "element",
        tagName: "button",
        properties: { type: "button", className: ["code-block-copy"], dataCopyCode: "" },
        children: [{ type: "text", value: "copy" }],
      });
      root.children = [
        {
          type: "element",
          tagName: "div",
          properties: { className: ["code-block"] },
          children: [
            { type: "element", tagName: "div", properties: { className: ["code-block-head"] }, children: head },
            ...(root.children as ElementContent[]),
          ],
        },
      ];
    },
  };
}

export function rehypeCodeCopyLabel() {
  return (tree: Root, file: { path?: string }) => {
    const locale: Locale = /content[\\/]blog[\\/]ru[\\/]/.test(file.path ?? "") ? "ru" : "en";
    const walk = (node: Root | RootContent) => {
      if (node.type === "element" && node.tagName === "button" && "dataCopyCode" in node.properties) {
        node.properties.ariaLabel = t(locale, "blogPost.copyCode");
      }
      if ("children" in node) node.children.forEach(walk);
    };
    walk(tree);
  };
}
