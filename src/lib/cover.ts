// Per-post generative cover (rule A8): a minimap of the article itself. The x axis
// is the reading order; each block of the MDX source takes columns in proportion
// to its estimated rendered height and draws its own texture, so the cover shows
// where the sections, code, figures and lists are.
import { ditherField } from "./dither";
import { pluralize } from "./plural";
import type { Locale } from "./i18n";

export const COVER_W = 184;
export const COVER_H = 20;
/** First row of content blocks; the rows above it hold only the h2 and h3 rules. */
const CONTENT_TOP = 5;
/** Top row of a heading rule by depth: an h2 spans the full height, an h3 starts higher than the content, deeper ones match it. */
const HEADING_TOP: Record<number, number> = { 2: 0, 3: 3 };
/** Paper columns between two blocks. */
const GAP = 1;
/** Narrowest block, so a short one still shows its texture. */
const MIN_W = 3;

/**
 * One block of the article, in reading order. `h` is a heading and `n` its depth;
 * for the other kinds `n` is the estimated rendered height in lines.
 * `p` prose, `l` list, `c` code or display math, `f` figure.
 */
export type OutlineKind = "h" | "p" | "l" | "c" | "f";
export interface OutlineItem {
  kind: OutlineKind;
  n: number;
}

/** The compact form stored in blogData: space-separated tokens such as `h2 p38 f14 c6`. */
export const formatOutline = (items: readonly OutlineItem[]) => items.map((i) => `${i.kind}${i.n}`).join(" ");

export function parseOutline(outline: string): OutlineItem[] {
  return [...outline.matchAll(/([hplcf])(\d+)/g)].map((m) => ({ kind: m[1] as OutlineKind, n: Number(m[2]) }));
}

export interface CoverSpan extends OutlineItem {
  /** First column. */
  x0: number;
  /** Column after the last one. */
  x1: number;
}

/**
 * Columns of every block: a heading is one column wide, every other block gets
 * `MIN_W` columns (fewer only when the room is too small) and the rest of the
 * room is shared by weight, with `GAP` between all blocks.
 */
export function coverLayout(items: readonly OutlineItem[]): CoverSpan[] {
  const blocks = items.filter((i) => i.kind !== "h");
  const room = COVER_W - (items.length - blocks.length) - Math.max(0, items.length - 1) * GAP;
  const floor = blocks.length > 0 ? Math.min(MIN_W, Math.floor(room / blocks.length)) : 0;
  const extra = room - floor * blocks.length;
  const weights = blocks.map((b) => Math.max(b.n, 1));
  const sum = weights.reduce((s, w) => s + w, 0);

  const spans: CoverSpan[] = [];
  let x = 0;
  let cum = 0;
  let k = 0;
  for (const item of items) {
    if (spans.length > 0) x += GAP;
    let width = 1;
    if (item.kind !== "h") {
      // Cumulative rounding, so the widths add up to the room exactly.
      const before = Math.round((cum / sum) * extra);
      cum += weights[k++]!;
      width = floor + Math.round((cum / sum) * extra) - before;
    }
    spans.push({ ...item, x0: x, x1: x + width });
    x += width;
  }
  return spans;
}

/** Share of ink before the Bayer threshold for the dithered kinds. */
const DENSITY: Partial<Record<OutlineKind, number>> = { p: 0.3, c: 0.72 };

export function coverPixels(outline: string): Uint8Array {
  const spans = coverLayout(parseOutline(outline));
  const field = new Float32Array(COVER_W * COVER_H);
  for (const s of spans) {
    const density = DENSITY[s.kind];
    if (density === undefined) continue;
    for (let y = CONTENT_TOP; y < COVER_H; y++) field.fill(density, y * COVER_W + s.x0, y * COVER_W + s.x1);
  }
  const px = ditherField(field, COVER_W, COVER_H);
  const ink = (x: number, y: number) => {
    if (x >= 0 && x < COVER_W) px[y * COVER_W + x] = 1;
  };
  for (const s of spans) {
    if (s.kind === "h") {
      for (let y = HEADING_TOP[s.n] ?? CONTENT_TOP; y < COVER_H; y++) ink(s.x0, y);
    } else if (s.kind === "f") {
      // A figure is an empty frame.
      for (let x = s.x0; x < s.x1; x++) {
        ink(x, CONTENT_TOP);
        ink(x, COVER_H - 1);
      }
      for (let y = CONTENT_TOP; y < COVER_H; y++) {
        ink(s.x0, y);
        ink(s.x1 - 1, y);
      }
    } else if (s.kind === "l") {
      // A list is rows of dots, like bullets.
      for (let y = CONTENT_TOP + 1; y < COVER_H; y += 3) for (let x = s.x0; x < s.x1; x += 2) ink(x, y);
    }
  }
  return px;
}

/** Columns where each h2 starts, in reading order; the header numbers the sections there. */
export const coverSections = (outline: string) =>
  coverLayout(parseOutline(outline))
    .filter((s) => s.kind === "h" && s.n === 2)
    .map((s) => s.x0);

const WORD_FORMS = { en: ["word", "words"], ru: ["слово", "слова", "слов"] } as { en: [string, string]; ru: [string, string, string] };
const SECTION_FORMS = { en: ["section", "sections"], ru: ["раздел", "раздела", "разделов"] } as {
  en: [string, string];
  ru: [string, string, string];
};
const FIGURE_FORMS = { en: ["figure", "figures"], ru: ["рисунок", "рисунка", "рисунков"] } as {
  en: [string, string];
  ru: [string, string, string];
};
const CODE_FORMS = { en: ["code block", "code blocks"], ru: ["блок кода", "блока кода", "блоков кода"] } as {
  en: [string, string];
  ru: [string, string, string];
};

/** What the cover draws, in the order the caption prints it; kinds the post does not have are left out. */
export function coverCaption(input: { wordCount: number; outline: string }, locale: Locale): string {
  const items = parseOutline(input.outline);
  const count = (pred: (i: OutlineItem) => boolean) => items.filter(pred).length;
  const parts = [
    pluralize(input.wordCount, locale, WORD_FORMS),
    pluralize(count((i) => i.kind === "h" && i.n === 2), locale, SECTION_FORMS),
  ];
  const figures = count((i) => i.kind === "f");
  const code = count((i) => i.kind === "c");
  if (figures > 0) parts.push(pluralize(figures, locale, FIGURE_FORMS));
  if (code > 0) parts.push(pluralize(code, locale, CODE_FORMS));
  return parts.join(", ");
}

export const coverPath = (lang: string, slug: string) => `/covers/${lang}-${slug}.svg`;
