// Per-post generative cover (rule A8): a minimap of the article itself. The x axis
// is the reading order; each block of the MDX source takes columns in proportion
// to its estimated rendered height and draws its own texture, so the cover shows
// where the sections, code, figures and lists are.
import { bayerRank, bayerThreshold } from "./dither";
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

/** What `inkAt` returns for a pixel of a rule or a frame, which draw as one stroke. */
const STROKE = 8;

/** Ink of the block `s` at (x, y): its dissolve rank 0 to 7, `STROKE`, or -1 for paper. */
function inkAt(s: CoverSpan, x: number, y: number): number {
  if (s.kind === "h") return y >= (HEADING_TOP[s.n] ?? CONTENT_TOP) ? STROKE : -1;
  if (y < CONTENT_TOP) return -1;
  // A figure is an empty frame.
  if (s.kind === "f") return x === s.x0 || x === s.x1 - 1 || y === CONTENT_TOP || y === COVER_H - 1 ? STROKE : -1;
  // A list is rows of dots, like bullets; they dissolve in from the left.
  if (s.kind === "l") {
    const dot = (y - CONTENT_TOP - 1) % 3 === 0 && (x - s.x0) % 2 === 0;
    return dot ? Math.min(7, Math.floor(((x - s.x0) / (s.x1 - s.x0)) * 8)) : -1;
  }
  const t = bayerThreshold(x, y);
  return DENSITY[s.kind]! > t ? bayerRank(x, y) : -1;
}

export function coverPixels(outline: string): Uint8Array {
  const px = new Uint8Array(COVER_W * COVER_H);
  for (const s of coverLayout(parseOutline(outline))) {
    for (let y = 0; y < COVER_H; y++) for (let x = s.x0; x < s.x1; x++) if (inkAt(s, x, y) >= 0) px[y * COVER_W + x] = 1;
  }
  return px;
}

export interface CoverBlockArt extends CoverSpan {
  /** Index of the h2 section the block is in; -1 before the first h2. */
  section: number;
  /** Index of the figure among the post's figures, in reading order; -1 for other kinds. */
  figure: number;
  /** Path data per dissolve rank (index 0 appears first): the pixels of prose, code and lists. */
  ranks: string[];
  /** Path data of a rule (top to bottom) or a frame (clockwise), drawn as one stroke. */
  stroke: string;
}

/** The cover as layers for an inline SVG: every block with its section, its pixels by dissolve rank and its stroke. */
export function coverArt(outline: string): CoverBlockArt[] {
  let section = -1;
  let figure = -1;
  return coverLayout(parseOutline(outline)).map((s) => {
    if (s.kind === "h" && s.n === 2) section++;
    if (s.kind === "f") figure++;
    const ranks = Array.from({ length: 8 }, () => "");
    if (s.kind !== "h" && s.kind !== "f") {
      for (let y = CONTENT_TOP; y < COVER_H; y++) {
        let x = s.x0;
        while (x < s.x1) {
          const rank = inkAt(s, x, y);
          if (rank < 0) {
            x++;
            continue;
          }
          // One run per rank: neighbours of the same rank join.
          const start = x;
          while (x < s.x1 && inkAt(s, x, y) === rank) x++;
          ranks[rank] += `M${start} ${y}.5h${x - start}`;
        }
      }
    }
    const stroke =
      s.kind === "h" ? `M${s.x0}.5 ${HEADING_TOP[s.n] ?? CONTENT_TOP}V${COVER_H}`
      : s.kind === "f" ? `M${s.x0}.5 ${CONTENT_TOP}.5H${s.x1 - 1}.5V${COVER_H - 1}.5H${s.x0}.5Z`
      : "";
    return { ...s, section, figure: s.kind === "f" ? figure : -1, ranks, stroke };
  });
}

/**
 * Where the reading line is on the cover, from 0 (left edge) to 1 (right edge).
 * `anchors` pair page positions with cover positions in document order: the
 * content top at 0, each h2 at its column, the content bottom at 1. Between two
 * anchors the position is linear, so each section fills at its own pace.
 */
export function coverReadPosition(line: number, anchors: readonly { top: number; x: number }[]): number {
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (!first || !last || line <= first.top) return 0;
  if (line >= last.top) return 1;
  const i = anchors.findLastIndex((a) => a.top <= line);
  const a = anchors[i]!;
  const b = anchors[i + 1]!;
  return b.top > a.top ? a.x + ((line - a.top) / (b.top - a.top)) * (b.x - a.x) : a.x;
}

/** Figures and code blocks in each h2 section, for the caption of the section under the pointer. */
export function sectionCounts(art: readonly CoverBlockArt[], section: number) {
  const inSection = art.filter((b) => b.section === section);
  return { figures: inSection.filter((b) => b.kind === "f").length, code: inSection.filter((b) => b.kind === "c").length };
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

/** "2 figures, 1 code block", leaving out a kind with none. */
export function countsLabel(counts: { figures: number; code: number }, locale: Locale): string {
  const parts: string[] = [];
  if (counts.figures > 0) parts.push(pluralize(counts.figures, locale, FIGURE_FORMS));
  if (counts.code > 0) parts.push(pluralize(counts.code, locale, CODE_FORMS));
  return parts.join(", ");
}

/** What the cover draws, in the order the caption prints it; kinds the post does not have are left out. */
export function coverCaption(input: { wordCount: number; outline: string }, locale: Locale): string {
  const items = parseOutline(input.outline);
  const count = (pred: (i: OutlineItem) => boolean) => items.filter(pred).length;
  const parts = [
    pluralize(input.wordCount, locale, WORD_FORMS),
    pluralize(count((i) => i.kind === "h" && i.n === 2), locale, SECTION_FORMS),
  ];
  const counts = countsLabel({ figures: count((i) => i.kind === "f"), code: count((i) => i.kind === "c") }, locale);
  if (counts) parts.push(counts);
  return parts.join(", ");
}

