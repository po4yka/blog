import { describe, it, expect } from "vitest";
import { scramble } from "@/lib/decode";

describe("scramble", () => {
  const rand = () => 0; // always the first glyph, "0"

  it("returns the final text when fully revealed", () => {
    expect(scramble("a1b2c3d", 7, rand)).toBe("a1b2c3d");
  });

  it("scrambles only the unrevealed letters and digits", () => {
    expect(scramble("Oct 31, 2026", 2, rand)).toBe("Oc0 00, 0000");
  });

  it("keeps the character count for Cyrillic", () => {
    const out = scramble("3 поста", 0, rand);
    expect([...out]).toHaveLength([..."3 поста"].length);
    expect(out).toBe("0 00000");
  });

  it("uses only mono Latin and digit glyphs", () => {
    expect(scramble("постов", 0)).toMatch(/^[0-9a-f]{6}$/);
  });
});
