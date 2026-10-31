// 1-bit dithering shared by the build-time generators (project plates, post covers).
// Pure functions with no DOM or Node APIs, so the same code can run in a browser later.

/** FNV-1a, 32-bit. Stable across runtimes; used to seed patterns from real strings. */
export function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** First `length` hex digits of `hash32(input)`, the form captions print. */
export function hashHex(input: string, length = 8): string {
  return hash32(input).toString(16).padStart(8, "0").slice(0, length);
}

/** Caption of a project plate: it names the seed (the slug hash), never a metric. */
export const plateCaption = (slug: string) => `slug#${hashHex(slug, 4)}`;

/** mulberry32: a small seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Recursive Bayer index matrix, normalised to thresholds in (0, 1).
const BAYER_8 = (() => {
  let m = [[0]];
  while (m.length < 8) {
    const n = m.length;
    const next: number[][] = Array.from({ length: n * 2 }, () => new Array<number>(n * 2).fill(0));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = m[y]![x]! * 4;
        next[y]![x] = v;
        next[y]![x + n] = v + 2;
        next[y + n]![x] = v + 3;
        next[y + n]![x + n] = v + 1;
      }
    }
    m = next;
  }
  return m.map((row) => row.map((v) => (v + 0.5) / 64));
})();

export type DitherMode = "ordered" | "diffusion";

/**
 * Turn a field of values in [0, 1] (row-major, `width * height`) into 1-bit
 * pixels: 1 is ink, 0 is paper. "ordered" uses an 8x8 Bayer matrix and is
 * monotone: raising any value never removes a pixel. "diffusion" is
 * Floyd-Steinberg error diffusion.
 */
export function ditherField(values: ArrayLike<number>, width: number, height: number, mode: DitherMode = "ordered"): Uint8Array {
  if (values.length !== width * height) throw new Error(`ditherField: expected ${width * height} values, got ${values.length}`);
  const out = new Uint8Array(width * height);
  if (mode === "ordered") {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        out[i] = values[i]! > BAYER_8[y % 8]![x % 8]! ? 1 : 0;
      }
    }
    return out;
  }
  const err = Float32Array.from(values);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const ink = err[i]! >= 0.5 ? 1 : 0;
      out[i] = ink;
      const e = err[i]! - ink;
      if (x + 1 < width) err[i + 1]! += (e * 7) / 16;
      if (y + 1 < height) {
        if (x > 0) err[i + width - 1]! += (e * 3) / 16;
        err[i + width]! += (e * 5) / 16;
        if (x + 1 < width) err[i + width + 1]! += e / 16;
      }
    }
  }
  return out;
}

/**
 * Field for a project identity mark: three plane waves whose frequencies and
 * phases come from the seed, symmetric on the vertical axis, scaled so the
 * mean value is about `density`. Same seed and size always give the same field.
 */
export function markField(seed: number, size: number, density: number): Float32Array {
  const rand = mulberry32(seed);
  const waves = Array.from({ length: 3 }, () => ({
    fx: 0.25 + rand() * 0.9,
    fy: 0.25 + rand() * 0.9,
    phase: rand() * Math.PI * 2,
  }));
  const field = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const mx = Math.min(x, size - 1 - x);
      let v = 0;
      for (const w of waves) v += Math.sin(w.fx * mx + w.fy * y + w.phase);
      // 2.2: contrast, so the mark has solid and empty bands, not one flat dither tone.
      const u = Math.min(1, Math.max(0, 0.5 + (v / 6) * 2.2));
      field[y * size + x] = Math.min(1, u * 2 * density);
    }
  }
  return field;
}

/** Copy the left half onto the right, mirrored. The Bayer matrix is not symmetric, so marks mirror after dithering. */
export function mirrorX(pixels: Uint8Array, width: number, height: number): Uint8Array {
  const out = pixels.slice();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < Math.floor(width / 2); x++) out[y * width + (width - 1 - x)] = pixels[y * width + x]!;
  }
  return out;
}

/**
 * 1-bit pixels as one SVG path: each run of ink is a 1-unit-wide horizontal
 * stroke through the middle of its row, with relative moves inside a row. The
 * SVG sets no colour of its own when `color` is omitted (black, used as a CSS
 * mask, so the page colours it).
 */
export function pixelsToSvg(pixels: Uint8Array, width: number, height: number, color = "#000"): string {
  let d = "";
  for (let y = 0; y < height; y++) {
    let x = 0;
    let penX = -1;
    while (x < width) {
      if (!pixels[y * width + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < width && pixels[y * width + x]) x++;
      d += penX < 0 ? `M${start} ${y}.5h${x - start}` : `m${start - penX} 0h${x - start}`;
      penX = x;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges"><path d="${d}" stroke="${color}"/></svg>\n`;
}

// --- Hero field (home page): density follows the weekly commit counts, left (oldest) to right (newest). ---

/** Tuning for `heroField`. Densities are the share of cells that carry ink before the Bayer threshold. */
export const HERO_FIELD = {
  /** Density with no commits at all, and the floor under every column. */
  flat: 0.05,
  /** Extra density at the busiest week. */
  gain: 0.3,
  /** Density inside the name glyphs (the echo); the seed adds `glyphGain` on top. */
  glyphFloor: 0.14,
  glyphGain: 0.5,
  /** Pointer response: cells within `pointerRadius` sample the field up to `pointerPush` cells further out. */
  pointerRadius: 18,
  pointerPush: 7,
} as const;

// Slow drift: a triangle wave down the rows that moves one cycle in about 10 s at 15 fps.
const ROW_FREQ = 0.045;
const TIME_FREQ = 0.0067;

/** Seven-day totals of a day-count series (oldest first), scaled so the busiest week is 1. Empty when there is nothing to show. */
export function weeklyDensity(counts: readonly number[]): number[] {
  const weeks: number[] = [];
  for (let i = 0; i + 7 <= counts.length; i += 7) {
    let sum = 0;
    for (let d = 0; d < 7; d++) sum += counts[i + d]!;
    weeks.push(sum);
  }
  const max = Math.max(0, ...weeks);
  return max > 0 ? weeks.map((w) => w / max) : [];
}

/** How far the pointer pushes the sample point of a cell `distance` cells away from it: smooth to 0 at the radius, never above `pointerPush`. */
export function pointerPush(distance: number): number {
  const k = 1 - distance / HERO_FIELD.pointerRadius;
  return k > 0 ? HERO_FIELD.pointerPush * k * k : 0;
}

export interface HeroFieldParams {
  /** Per-week density in [0, 1], oldest first (`weeklyDensity`). Empty means a flat low density. */
  weeks: ArrayLike<number>;
  width: number;
  height: number;
  /** Integer frame counter; the drift is a pure function of it. */
  step: number;
  /** `width * height` flags, non-zero inside the name glyphs. */
  mask?: ArrayLike<number> | null;
  /** Pointer position in cells. */
  pointer?: { x: number; y: number } | null;
}

/**
 * One frame of the hero field as 1-bit pixels (1 is ink), ordered with the 8x8
 * Bayer matrix. Pure and deterministic: the same params give the same bytes in
 * Node (poster) and in the browser (canvas). Density never decreases when a
 * week's value rises. Pass `out` to reuse a buffer between frames.
 */
export function heroField(p: HeroFieldParams, out?: Uint8Array): Uint8Array {
  const { weeks, width, height, step, mask, pointer } = p;
  const size = width * height;
  const buf = out && out.length === size ? out : new Uint8Array(size);
  const n = weeks.length;
  const { flat, gain, glyphFloor, glyphGain, pointerRadius } = HERO_FIELD;
  const phase = step * TIME_FREQ;
  const r2 = pointerRadius * pointerRadius;
  for (let y = 0; y < height; y++) {
    const bayer = BAYER_8[y & 7]!;
    for (let x = 0; x < width; x++) {
      let sx = x;
      let sy = y;
      if (pointer) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < r2 && d2 > 0) {
          const d = Math.sqrt(d2);
          const push = pointerPush(d) / d;
          sx = x + dx * push;
          sy = y + dy * push;
        }
      }
      let col = 0;
      if (n > 0) {
        const u = width > 1 ? Math.min(n - 1, Math.max(0, (sx * (n - 1)) / (width - 1))) : 0;
        const i = Math.floor(u);
        col = i >= n - 1 ? weeks[n - 1]! : weeks[i]! + (weeks[i + 1]! - weeks[i]!) * (u - i);
      }
      let v = flat + gain * col;
      if (mask) {
        const mx = Math.min(width - 1, Math.max(0, Math.round(sx)));
        const my = Math.min(height - 1, Math.max(0, Math.round(sy)));
        if (mask[my * width + mx]) v = glyphFloor + glyphGain * col;
      }
      if (n > 0) {
        const q = sy * ROW_FREQ + phase;
        v *= 0.7 + 0.3 * Math.abs(2 * (q - Math.floor(q)) - 1);
      }
      buf[y * width + x] = v > bayer[x & 7]! ? 1 : 0;
    }
  }
  return buf;
}
