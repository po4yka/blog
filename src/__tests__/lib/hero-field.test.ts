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
