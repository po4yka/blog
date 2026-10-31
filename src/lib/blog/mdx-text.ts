// Shiki notation comments (`// [!code ++]`, `# [!code highlight]`, ...) mark lines in the
// rendered page only; plain-text consumers get the code without them.
const NOTATION = String.raw`(?:\/\/|#|--|\/\*|<!--)[ \t]*\[!code [^\]\n]+\][ \t]*(?:\*\/|-->)?`;
const NOTATION_LINE = new RegExp(String.raw`^[ \t]*${NOTATION}[ \t]*\n`, "gm");
const NOTATION_TAIL = new RegExp(String.raw`[ \t]*${NOTATION}[ \t]*$`, "gm");
const FENCE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gm;

/**
 * Strip MDX-specific syntax so LLM consumers (the `.md` endpoints and `llms-full.txt`) get clean
 * prose: ES import/export lines, self-closing and paired JSX component tags, and Shiki notation
 * comments.
 */
export function stripMdxSyntax(content: string): string {
  return content
    .replace(/^(import |export (?:const|type|default|function|class)\b).+(\n|$)/gm, "")
    .replace(/<[A-Z][A-Za-z0-9]*(?:\s[^>]*)?\s*\/>/gs, "")
    .replace(/<[A-Z][A-Za-z0-9]*(?:\s[^>]*)?\s*>/gs, "")
    .replace(/<\/[A-Z][A-Za-z0-9]*>/g, "")
    // only inside fences, so prose that documents the notation keeps it
    .replace(FENCE, (block) => block.replace(NOTATION_LINE, "").replace(NOTATION_TAIL, ""))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
