// Per-post generative cover (rule A8). Every input is a real field of the post:
// the slug hash picks the pattern, the word count sets the density, each heading
// is one band whose height follows its depth, and the publish date sets the phase.
import { ditherField, hash32, mulberry32 } from "./dither";
import { pluralize } from "./plural";
import type { Locale } from "./i18n";

export const COVER_W = 144;
export const COVER_H = 24;

export interface CoverInput {
  slug: string;
  wordCount: number;
  /** Depth (2 to 6) of each heading in document order. */
  headings: number[];
  /** Publish date, YYYY-MM-DD. */
  isoDate: string;
}

function dayOfYear(isoDate: string): number {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86_400_000);
}

export function coverField(input: CoverInput): Float32Array {
  const rand = mulberry32(hash32(input.slug));
  const phase = (dayOfYear(input.isoDate) / 366) * Math.PI * 2;
  const waves = Array.from({ length: 3 }, () => ({
    fx: 0.03 + rand() * 0.1,
    fy: 0.06 + rand() * 0.2,
    phase: rand() * Math.PI * 2 + phase,
  }));
  // 0.18 for a short note up to 0.55 at about 3,700 words.
  const density = Math.min(0.55, 0.18 + input.wordCount / 10_000);
  const bands = input.headings.length > 0 ? input.headings : [2];
  const bandWidth = COVER_W / bands.length;

  const field = new Float32Array(COVER_W * COVER_H);
  for (let x = 0; x < COVER_W; x++) {
    const band = Math.min(bands.length - 1, Math.floor(x / bandWidth));
    // An h2 band fills the height; each level deeper starts a third lower.
    const top = Math.round(COVER_H * Math.min(0.75, (bands[band]! - 2) / 3));
    // Two paper columns before each band, so the outline reads as separate sections.
    const gap = band > 0 && x - Math.floor(band * bandWidth) < 2;
    for (let y = 0; y < COVER_H; y++) {
      if (gap || y < top) continue;
      let v = 0;
      for (const w of waves) v += Math.sin(w.fx * x + w.fy * y + w.phase);
      const u = Math.min(1, Math.max(0, 0.5 + (v / 6) * 1.8));
      // Capped below solid ink so every region keeps a dither texture.
      field[y * COVER_W + x] = Math.min(0.85, density * (0.3 + 1.4 * u));
    }
  }
  return field;
}

export const coverPixels = (input: CoverInput) => ditherField(coverField(input), COVER_W, COVER_H);

const WORD_FORMS = { en: ["word", "words"], ru: ["слово", "слова", "слов"] } as { en: [string, string]; ru: [string, string, string] };
const HEADING_FORMS = { en: ["heading", "headings"], ru: ["заголовок", "заголовка", "заголовков"] } as {
  en: [string, string];
  ru: [string, string, string];
};

/** The cover's inputs, in the order the caption prints them. */
export function coverCaption(input: CoverInput, locale: Locale): string {
  return [
    input.slug,
    pluralize(input.wordCount, locale, WORD_FORMS),
    pluralize(input.headings.length, locale, HEADING_FORMS),
    input.isoDate,
  ].join(", ");
}

export const coverPath = (lang: string, slug: string) => `/covers/${lang}-${slug}.svg`;
