import { describe, expect, it } from "vitest";
import { HERO_FIELD, heroField, pointerPush, weeklyDensity } from "@/lib/dither";

const W = 96;
const H = 48;
const WEEKS = [0.1, 0.4, 1, 0.6, 0.2];
const ink = (p: Uint8Array) => p.reduce((n, v) => n + v, 0);
const base = { weeks: WEEKS, width: W, height: H, step: 0 };

describe("weeklyDensity", () => {
  it("sums seven days per week and scales the busiest week to 1", () => {
    const counts = [...new Array(7).fill(1), ...new Array(7).fill(4), ...new Array(7).fill(2)];
    expect(weeklyDensity(counts)).toEqual([7 / 28, 1, 14 / 28]);
  });

  it("is empty for no data or all zeros", () => {
    expect(weeklyDensity([])).toEqual([]);
    expect(weeklyDensity(new Array(91).fill(0))).toEqual([]);
  });
});

describe("heroField", () => {
  it("is deterministic for the same params and differs between steps", () => {
    expect(heroField(base)).toEqual(heroField(base));
    expect(heroField({ ...base, step: 40 })).not.toEqual(heroField(base));
  });

  it("returns 1-bit pixels and reuses a buffer of the right size", () => {
    const out = new Uint8Array(W * H);
    const res = heroField(base, out);
    expect(res).toBe(out);
    expect(res.every((v) => v === 0 || v === 1)).toBe(true);
  });

  it("never loses ink when a week's count rises", () => {
    const low = heroField({ ...base, weeks: [0.2, 0.2, 0.2, 0.2, 0.2] });
    const high = heroField({ ...base, weeks: [0.2, 0.2, 0.9, 0.2, 0.2] });
    expect(ink(high)).toBeGreaterThan(ink(low));
    for (let i = 0; i < low.length; i++) expect(high[i]!).toBeGreaterThanOrEqual(low[i]!);
  });

  it("falls back to a flat low density with no seed", () => {
    const flat = heroField({ ...base, weeks: [] });
    const share = ink(flat) / flat.length;
    expect(share).toBeGreaterThan(0);
    expect(share).toBeLessThan(HERO_FIELD.flat + 0.03);
  });

  it("follows the seed from left (oldest) to right (newest)", () => {
    const out = heroField({ ...base, weeks: [0, 0, 0, 1, 1] });
    const part = (from: number, to: number) => {
      let n = 0;
      for (let y = 0; y < H; y++) for (let x = from; x < to; x++) n += out[y * W + x]!;
      return n;
    };
    expect(part(W / 2, W)).toBeGreaterThan(part(0, W / 2));
  });

  it("is denser inside the glyph mask", () => {
    const mask = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W / 2; x++) mask[y * W + x] = 1;
    const out = heroField({ ...base, weeks: [0.5, 0.5, 0.5, 0.5, 0.5], mask });
    let inside = 0;
    let outside = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (x < W / 2) inside += out[y * W + x]!;
        else outside += out[y * W + x]!;
      }
    }
    expect(inside).toBeGreaterThan(outside);
  });
});

describe("pointer response", () => {
  it("pushes by at most pointerPush and not at all from the radius out", () => {
    for (let d = 0; d < 40; d += 0.5) {
      const push = pointerPush(d);
      expect(push).toBeGreaterThanOrEqual(0);
      expect(push).toBeLessThanOrEqual(HERO_FIELD.pointerPush);
    }
    expect(pointerPush(HERO_FIELD.pointerRadius)).toBe(0);
    expect(pointerPush(HERO_FIELD.pointerRadius + 5)).toBe(0);
  });

  it("changes only cells inside the radius", () => {
    const pointer = { x: 40, y: 24 };
    const still = heroField(base);
    const moved = heroField({ ...base, pointer });
    let changed = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (still[y * W + x] === moved[y * W + x]) continue;
        changed++;
        expect(Math.hypot(x - pointer.x, y - pointer.y)).toBeLessThan(HERO_FIELD.pointerRadius);
      }
    }
    expect(changed).toBeGreaterThan(0);
  });
});

// The per-cell form of heroField (nothing tabled). The tabled version must match it byte for byte,
// or the build-time poster would drift from the canvas.
function bayer8(): number[][] {
  let m = [[0]];
  while (m.length < 8) {
    const n = m.length;
    const next = Array.from({ length: n * 2 }, () => new Array<number>(n * 2).fill(0));
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
}

type Pt = { x: number; y: number } | null;

function referenceField(weeks: number[], width: number, height: number, step: number, mask: Uint8Array | null, pointer: Pt) {
  const B = bayer8();
  const n = weeks.length;
  const { flat, gain, glyphFloor, glyphGain, pointerRadius } = HERO_FIELD;
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sx = x;
      let sy = y;
      if (pointer) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < pointerRadius * pointerRadius && d2 > 0) {
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
        const q = sy * 0.045 + step * 0.0067;
        v *= 0.7 + 0.3 * Math.abs(2 * (q - Math.floor(q)) - 1);
      }
      out[y * width + x] = v > B[y & 7]![x & 7]! ? 1 : 0;
    }
  }
  return out;
}

describe("heroField tabled form", () => {
  const mask = new Uint8Array(W * H).map((_, i) => ((i % W) % 13 < 6 && Math.floor(i / W) % 9 < 5 ? 1 : 0));
  const cases: [string, number[], Uint8Array | null, Pt][] = [
    ["no seed, no pointer", [], null, null],
    ["mask, no pointer", WEEKS, mask, null],
    ["pointer inside, mask", WEEKS, mask, { x: 40.5, y: 20.25 }],
    ["pointer at the corner, no mask", WEEKS, null, { x: 0, y: 0 }],
    ["pointer outside the grid", WEEKS, mask, { x: W + 30, y: -4 }],
  ];
  it.each(cases)("matches the per-cell form: %s", (_label, weeks, m, pointer) => {
    for (const step of [0, 7, 301]) {
      const got = heroField({ weeks, width: W, height: H, step, mask: m, pointer });
      expect(Buffer.from(got).equals(Buffer.from(referenceField(weeks, W, H, step, m, pointer)))).toBe(true);
    }
  });
});
