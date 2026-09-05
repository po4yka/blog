// Monochrome Shiki themes for blog code blocks.
//
// The site has no chromatic accent, so syntax is carried by luminance steps
// and weight instead of hue: keywords at full emphasis (bold in the theme,
// remapped to weight 500 in CSS), identifiers at foreground, strings one
// step down, comments dim and italic. Both themes are emitted as CSS
// variables (`defaultColor: false` in astro.config.mjs) so the active site
// theme, not the OS, picks the palette.

import type { ThemeRegistrationRaw } from "shiki";

type TokenRule = { scope: string[]; settings: { foreground: string; fontStyle?: string } };

interface Palette {
  emphasis: string;
  foreground: string;
  operator: string;
  muted: string;
  dim: string;
  background: string;
}

const SCOPES = {
  keyword: [
    "keyword",
    "storage",
    "storage.type",
    "storage.modifier",
    "keyword.control",
    "keyword.operator.new",
    "keyword.operator.expression",
    "variable.language",
    "constant.language",
    "markup.heading",
  ],
  definition: [
    "entity.name.function",
    "entity.name.type",
    "entity.name.class",
    "entity.name.namespace",
    "entity.name.tag",
    "support.function",
    "support.class",
    "support.type",
    "meta.function-call",
    "markup.bold",
  ],
  string: [
    "string",
    "string.quoted",
    "string.template",
    "constant.character",
    "markup.inline.raw",
    "markup.quote",
  ],
  literal: ["constant.numeric", "constant.other", "support.constant", "entity.other.attribute-name"],
  comment: ["comment", "punctuation.definition.comment", "markup.italic"],
  operator: [
    "keyword.operator",
    "punctuation",
    "meta.brace",
    "punctuation.definition",
    "punctuation.separator",
    "punctuation.terminator",
  ],
} as const;

function buildTheme(name: string, type: "dark" | "light", p: Palette): ThemeRegistrationRaw {
  const rules: TokenRule[] = [
    { scope: [...SCOPES.keyword], settings: { foreground: p.emphasis, fontStyle: "bold" } },
    { scope: [...SCOPES.definition], settings: { foreground: p.foreground } },
    { scope: [...SCOPES.string], settings: { foreground: p.muted } },
    { scope: [...SCOPES.literal], settings: { foreground: p.foreground } },
    { scope: [...SCOPES.comment], settings: { foreground: p.dim, fontStyle: "italic" } },
    { scope: [...SCOPES.operator], settings: { foreground: p.operator } },
    { scope: ["variable", "variable.parameter", "variable.other", "meta.object-literal.key"], settings: { foreground: p.foreground } },
  ];
  return {
    name,
    type,
    colors: {
      "editor.background": p.background,
      "editor.foreground": p.foreground,
    },
    settings: [{ settings: { foreground: p.foreground, background: p.background } }, ...rules],
    tokenColors: rules,
  };
}

// Values mirror src/styles/theme.css: --emphasis, --foreground, --muted-foreground,
// --muted-foreground-dim, --code-bg. Comments keep at least 4.5:1 on --code-bg.
export const monoDark = buildTheme("po4yka-mono-dark", "dark", {
  emphasis: "#ffffff",
  foreground: "#e9e8e4",
  operator: "#bdbcb8",
  muted: "#a6a6ac",
  dim: "#8a8a90",
  background: "#16161a",
});

export const monoLight = buildTheme("po4yka-mono-light", "light", {
  emphasis: "#000000",
  foreground: "#101012",
  operator: "#4a4a50",
  muted: "#4a4a50",
  dim: "#6a6a70",
  background: "#eeebe4",
});
