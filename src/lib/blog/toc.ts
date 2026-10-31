export const TOC_MIN_ITEMS = 3;

export type TocItem = { id: string; text: string; level: 2 | 3 };
export type TocGroup = { item: TocItem; children: TocItem[] };

/** Astro `render()` headings to TOC items: depth 2 and 3 only, without the trailing "#" of the appended permalink anchor. */
export function tocFromHeadings(headings: { depth: number; slug: string; text: string }[]): TocItem[] {
  return headings
    .filter((h) => h.depth === 2 || h.depth === 3)
    .map((h) => ({ id: h.slug, text: h.text.trim().replace(/\s*#$/, ""), level: h.depth as 2 | 3 }));
}

/** Groups h3 items under the preceding h2. An h3 before any h2 stays top level. */
export function nestToc(items: TocItem[]): TocGroup[] {
  const groups: TocGroup[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (item.level === 3 && last && last.item.level === 2) last.children.push(item);
    else groups.push({ item, children: [] });
  }
  return groups;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * The active section is the last heading whose top is at or above `line`; `progress` runs 0..1 from that heading to the next one
 * (or to `endTop`, the bottom of the content, for the last one). At the end of the page the last heading is active with progress 1.
 * `tops` must be in document order.
 */
export function activeSection(
  tops: { id: string; top: number }[],
  line: number,
  atEnd: boolean,
  endTop?: number,
): { id: string | null; progress: number } {
  const lastHeading = tops[tops.length - 1];
  if (!lastHeading) return { id: null, progress: 0 };
  if (atEnd) return { id: lastHeading.id, progress: 1 };
  const index = tops.findLastIndex((h) => h.top <= line);
  const current = tops[index];
  if (!current) return { id: null, progress: 0 };
  const end = tops[index + 1]?.top ?? endTop;
  const span = end === undefined ? 0 : end - current.top;
  return { id: current.id, progress: span > 0 ? clamp01((line - current.top) / span) : 0 };
}
