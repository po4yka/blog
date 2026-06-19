import { describe, expect, it } from "vitest";
import { duration, ease, easeStep8, stagger } from "@/lib/motion";

describe("motion constants", () => {
  it("duration values are in ascending order", () => {
    expect(duration.fast).toBeLessThan(duration.base);
    expect(duration.base).toBeLessThan(duration.slow);
  });

  it("ease is a 4-element cubic-bezier array", () => {
    expect(ease).toHaveLength(4);
    ease.forEach((v) => expect(typeof v).toBe("number"));
  });

  it("stagger.fast is less than stagger.base", () => {
    expect(stagger.fast).toBeLessThan(stagger.base);
  });
});

describe("easeStep8", () => {
  it("returns 0 at t=0", () => {
    expect(easeStep8(0)).toBe(0);
  });

  it("returns 1 at t=1 (boundary: t >= 1 returns 1)", () => {
    expect(easeStep8(1)).toBe(1);
  });

  it("returns 1 for t > 1", () => {
    expect(easeStep8(1.5)).toBe(1);
  });

  it("steps in 8 discrete levels between 0 and 1", () => {
    // At t=0.125 (1/8) the step function should jump to the first level
    expect(easeStep8(0.124)).toBe(0); // just below 1/8
    expect(easeStep8(0.125)).toBe(1 / 8); // exactly 1/8
  });

  it("is monotonically non-decreasing", () => {
    const samples = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    for (let i = 1; i < samples.length; i++) {
      expect(easeStep8(samples[i]!)).toBeGreaterThanOrEqual(easeStep8(samples[i - 1]!));
    }
  });

  it("output is always in [0, 1]", () => {
    const samples = Array.from({ length: 20 }, (_, i) => i / 19);
    for (const t of samples) {
      const v = easeStep8(t);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
