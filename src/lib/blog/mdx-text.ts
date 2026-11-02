// Shiki notation comments (`// [!code ++]`, `# [!code highlight]`, ...) mark lines in the
// rendered page only; plain-text consumers get the code without them.
const NOTATION = String.raw`(?:\/\/|#|--|\/\*|<!--)[ \t]*\[!code [^\]\n]+\][ \t]*(?:\*\/|-->)?`;
const NOTATION_LINE = new RegExp(String.raw`^[ \t]*${NOTATION}[ \t]*\n`, "gm");
const NOTATION_TAIL = new RegExp(String.raw`[ \t]*${NOTATION}[ \t]*$`, "gm");
// Up to three spaces of indent, as CommonMark allows, so fences inside list items count too.
const FENCE = /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[ \t]*$/gm;
// A code span never crosses a blank line, so a stray backtick cannot hide paragraphs of JSX.
const INLINE_CODE = /(`+)(?:(?!\1)[^`\n]|`(?!\1)|\n(?![ \t]*\n))*?\1/g;

/** Applies `outside` to the text between matches of `pattern` and `inside` to each match. */
function mapSegments(text: string, pattern: RegExp, outside: (s: string) => string, inside: (s: string) => string): string {
  let out = "";
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    out += outside(text.slice(last, match.index)) + inside(match[0]);
    last = match.index + match[0].length;
  }
  return out + outside(text.slice(last));
}

// ESM lines are whole lines, so they are removed before the prose is split around inline code.
const stripEsm = (prose: string) => prose.replace(/^(import |export (?:const|type|default|function|class)\b).+(\n|$)/gm, "");

function stripJsx(prose: string): string {
  return prose
    .replace(/<[A-Z][A-Za-z0-9]*(?:\s[^>]*)?\s*\/>/gs, "")
    .replace(/<[A-Z][A-Za-z0-9]*(?:\s[^>]*)?\s*>/gs, "")
    .replace(/<\/[A-Z][A-Za-z0-9]*>/g, "");
}

/**
 * Strip MDX-specific syntax so LLM consumers (the `.md` endpoints and `llms-full.txt`) get clean
 * prose: ES import/export lines, self-closing and paired JSX component tags, and Shiki notation
 * comments. Code is kept as written: the MDX rules skip fenced blocks and inline code, so
 * `Flow<String>` and a Kotlin `import` line stay intact.
 */
export function stripMdxSyntax(content: string): string {
  return mapSegments(
    content,
    FENCE,
    (prose) => mapSegments(stripEsm(prose), INLINE_CODE, stripJsx, (code) => code),
    // only inside fences, so prose that documents the notation keeps it
    (block) => block.replace(NOTATION_LINE, "").replace(NOTATION_TAIL, ""),
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
