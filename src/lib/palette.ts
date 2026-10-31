/** Window event that asks the palette host (KeyboardShortcuts island) to open the palette. `detail` is the opener to refocus on close. */
export const PALETTE_EVENT = "palette:open";

export function openPalette(opener?: HTMLElement | null): void {
  window.dispatchEvent(new CustomEvent<HTMLElement | null>(PALETTE_EVENT, { detail: opener ?? null }));
}

export type PaletteGroup = "pages" | "posts" | "projects" | "actions" | "sections";

export interface PaletteItem {
  id: string;
  group: PaletteGroup;
  title: string;
  /** The typed command that does the same thing. */
  command: string;
  /** Real fields shown in mono next to the row (date, word count, year). */
  meta?: string;
  /** Extra text the filter matches (slug, tags). */
  keywords?: string[];
}

export const GROUP_ORDER: readonly PaletteGroup[] = ["pages", "posts", "projects", "actions", "sections"];

/** Lower is better. Infinity means no match. */
function score(item: PaletteItem, q: string): number {
  const title = item.title.toLowerCase();
  const command = item.command.toLowerCase();
  if (title.startsWith(q) || command.startsWith(q)) return 0;
  if (title.includes(q)) return 1;
  if (command.includes(q)) return 2;
  if (item.keywords?.some((k) => k.toLowerCase().includes(q))) return 3;
  return Infinity;
}

/**
 * Filter and rank palette items. An empty query keeps every item. Matches title, command text, slug and tags, case-insensitive.
 * Results stay in group order (the list is grouped); inside a group the better match comes first and ties keep source order.
 */
export function filterItems(items: readonly PaletteItem[], query: string): PaletteItem[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, " ");
  const scored = items
    .map((item, i) => ({ item, i, s: q ? score(item, q) : 0 }))
    .filter((x) => x.s !== Infinity);
  const rank = (g: PaletteGroup) => GROUP_ORDER.indexOf(g);
  scored.sort((a, b) => rank(a.item.group) - rank(b.item.group) || a.s - b.s || a.i - b.i);
  return scored.map((x) => x.item);
}
