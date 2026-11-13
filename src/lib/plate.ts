// Project plates (rule A8): an 8x8 1-bit mark. The silhouette comes from the
// project's first platform, so projects of one kind look related; the detail
// inside it comes from the slug hash, so no two plates are the same.
import { bayerRank, ditherField, hash32, markField, mirrorX } from "./dither";

export const PLATE_SIZE = 8;
/** Share of the inside that is ink at rest, and on hover or focus. */
const REST_DENSITY = 0.3;
const HOVER_DENSITY = 0.8;

// "#" is the outline (always ink), "." the inside (slug detail), " " paper. Each row is symmetric.
const SILHOUETTES: Record<string, string[]> = {
  // A server rack: two bays on feet.
  backend: ["########", "#......#", "#......#", "########", "#......#", "#......#", "########", "  #  #  "],
  // A hex nut.
  tooling: ["  ####  ", " #....# ", "#..##..#", "#.#  #.#", "#.#  #.#", "#..##..#", " #....# ", "  ####  "],
  // A phone with a home button.
  android: [" ###### ", " #....# ", " #....# ", " #....# ", " #....# ", " ###### ", " #.##.# ", " ###### "],
  // A browser window with its title bar.
  web: ["########", "########", "#......#", "#......#", "#......#", "#......#", "#......#", "########"],
  // Anything else: a diamond.
  other: ["   ##   ", "  #..#  ", " #....# ", "#......#", "#......#", " #....# ", "  #..#  ", "   ##   "],
};

/** The silhouette key of a project: its first platform, lower-cased, or "other". */
export function plateKind(platform: string | undefined): string {
  const key = (platform ?? "").toLowerCase();
  return key in SILHOUETTES ? key : "other";
}

/** Caption of a plate: it names both seeds, the silhouette and the slug, never a metric. The slug is printed as text: a hex digest beside a year reads as a commit. */
export const plateCaption = (slug: string, platform: string | undefined) => `${plateKind(platform)} · seed ${slug}`;

export interface PlateArt {
  /** Path data of the outline and of the inside pixels shown at rest. */
  rest: string;
  /** Path data per dissolve rank of the inside pixels that only the hover density adds (index 0 appears first). */
  late: string[];
}

const run = (x: number, y: number, len: number) => `M${x} ${y}.5h${len}`;

/** Rows of `pixels` (`PLATE_SIZE` wide) where `pick(x, y)` holds, as 1-unit strokes. */
function path(pick: (x: number, y: number) => boolean): string {
  let d = "";
  for (let y = 0; y < PLATE_SIZE; y++) {
    let x = 0;
    while (x < PLATE_SIZE) {
      if (!pick(x, y)) {
        x++;
        continue;
      }
      const start = x;
      while (x < PLATE_SIZE && pick(x, y)) x++;
      d += run(start, y, x - start);
    }
  }
  return d;
}

export function plateArt(slug: string, platform: string | undefined): PlateArt {
  const shape = SILHOUETTES[plateKind(platform)]!;
  const seed = hash32(slug);
  const at = (x: number, y: number) => shape[y]![x]!;
  const mark = (density: number) =>
    mirrorX(ditherField(markField(seed, PLATE_SIZE, density), PLATE_SIZE, PLATE_SIZE), PLATE_SIZE, PLATE_SIZE);
  const rest = mark(REST_DENSITY);
  const dense = mark(HOVER_DENSITY);
  const inside = (x: number, y: number) => at(x, y) === ".";
  // The mirrored cell takes the rank of its source on the left half, so both sides dissolve together.
  const rank = (x: number, y: number) => bayerRank(Math.min(x, PLATE_SIZE - 1 - x), y);
  const added = (x: number, y: number) => inside(x, y) && !!dense[y * PLATE_SIZE + x] && !rest[y * PLATE_SIZE + x];
  return {
    rest: path((x, y) => at(x, y) === "#" || (inside(x, y) && !!rest[y * PLATE_SIZE + x])),
    late: Array.from({ length: 8 }, (_, r) => path((x, y) => added(x, y) && rank(x, y) === r)),
  };
}
