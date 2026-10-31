export const TOC_MIN_ITEMS = 3;

export type TocItem = { id: string; text: string; level: 2 | 3 };

export function toTocItems(raw: { id: string; tagName: string; text: string }[]): TocItem[] {
  return raw.map((h) => ({
    id: h.id,
    text: h.text.trim(),
    level: h.tagName === "H2" ? 2 : 3,
  }));
}

/** The intersecting heading nearest the top of the viewport, or null. Ties keep input order (stable sort). */
export function pickActiveId(entries: { isIntersecting: boolean; top: number; id: string }[]): string | null {
  const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.top - b.top)[0];
  return visible ? visible.id : null;
}
