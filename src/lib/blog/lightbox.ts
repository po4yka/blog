// Pure helpers for the blog image lightbox. DOM reading lives in
// components/ImageLightbox/figures.ts; everything here is testable under Node.

export const MOBILE_QUERY = "(max-width: 640px)";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

export interface VariantSource {
  srcset: string;
  requiresDark: boolean;
  requiresMobile: boolean;
  mimeType: string | null;
}

/** Attributes of one <source>, as read from the DOM. */
export interface RawSource {
  srcset: string;
  media: string;
  type: string | null;
  theme?: string;
  viewport?: string;
}

/**
 * BlogFigure tags sources with data-theme / data-viewport so the lightbox can
 * pick the right variant regardless of how the runtime rewrites `media` to
 * sync with the site's manual theme toggle. The media regex is the fallback
 * for raw-<picture> posts. Sources without a srcset are dropped (null).
 */
export function parseSource(raw: RawSource): VariantSource | null {
  if (!raw.srcset) return null;
  const requiresDark =
    raw.theme === "dark" || (raw.theme === undefined && /prefers-color-scheme:\s*dark/i.test(raw.media));
  const requiresMobile =
    raw.viewport === "mobile" ||
    (raw.viewport === undefined && /max-width:\s*640px/i.test(raw.media));
  return { srcset: raw.srcset, requiresDark, requiresMobile, mimeType: raw.type };
}

// Prefer PNG for the lightbox's single <img> render — broad decoder support
// across browsers and image tooling. Fall back to the first format-agnostic
// match (AVIF/WebP), then to the <img>'s fallback src.
export function pickVariant(
  figure: { sources: VariantSource[]; fallbackSrc: string },
  isDark: boolean,
  isMobile: boolean,
): string {
  const matches = figure.sources.filter(
    (s) => !(s.requiresDark && !isDark) && !(s.requiresMobile && !isMobile) && s.srcset,
  );
  const png = matches.find((s) => s.mimeType === "image/png" || s.mimeType === null);
  if (png) return png.srcset;
  const first = matches[0];
  if (first) return first.srcset;
  return figure.fallbackSrc;
}

/**
 * Prefer the <figcaption> text (BlogFigure), then the sibling caption
 * paragraph (raw-<picture> posts), then alt. Callers pass trimmed text, and
 * siblingText must be null when the image is not inside a <picture>.
 */
export function resolveCaption(input: {
  alt: string;
  figcaptionText: string | null | undefined;
  siblingText: string | null | undefined;
}): string {
  if (input.figcaptionText && input.figcaptionText.length > 0) return input.figcaptionText;
  if (input.siblingText && input.siblingText.length > 0) return input.siblingText;
  return input.alt;
}

/** Parse the 1-indexed ?fig=N param into a 0-indexed figure index, or null. */
export function parseFigParam(fig: string | null, count: number): number | null {
  if (fig === null) return null;
  const n = parseInt(fig, 10) - 1;
  return Number.isFinite(n) && n >= 0 && n < count ? n : null;
}

export function wrapIndex(index: number, delta: number, count: number): number {
  return (index + delta + count) % count;
}

const SWIPE_DISTANCE = 80;
const SWIPE_VELOCITY = 500;

/** 1 = next, -1 = previous, 0 = none. The negative side is checked first. */
export function swipeDirection(distance: number, velocity: number): 1 | -1 | 0 {
  if (distance < -SWIPE_DISTANCE || velocity < -SWIPE_VELOCITY) return 1;
  if (distance > SWIPE_DISTANCE || velocity > SWIPE_VELOCITY) return -1;
  return 0;
}
