import { describe, expect, it } from "vitest";
import { ditherField, hash32, hashHex, markField, mirrorX, mulberry32, pixelsToSvg } from "@/lib/dither";
import { generatePlateFiles } from "../../../scripts/generate-plates";

const ink = (p: Uint8Array) => p.reduce((n, v) => n + v, 0);

describe("hash32", () => {
  it("matches the FNV-1a reference values", () => {
    expect(hash32("")).toBe(0x811c9dc5);
    expect(hash32("a")).toBe(0xe40c292c);
    expect(hashHex("a", 4)).toBe("e40c");
  });
});

describe("mulberry32", () => {
  it("repeats for the same seed and differs between seeds", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seqA);
    expect(mulberry32(43)()).not.toBe(seqA[0]);
    for (const v of seqA) expect(v >= 0 && v < 1).toBe(true);
  });
});

describe("ditherField", () => {
  it("maps 0 to paper and 1 to ink in both modes", () => {
    for (const mode of ["ordered", "diffusion"] as const) {
      expect(ink(ditherField(new Array(64).fill(0), 8, 8, mode))).toBe(0);
      expect(ink(ditherField(new Array(64).fill(1), 8, 8, mode))).toBe(64);
    }
  });

  it("keeps the mean tone of a flat field", () => {
    const flat = new Array(64 * 64).fill(0.25);
    expect(ink(ditherField(flat, 64, 64, "ordered")) / flat.length).toBeCloseTo(0.25, 2);
    expect(ink(ditherField(flat, 64, 64, "diffusion")) / flat.length).toBeCloseTo(0.25, 1);
  });

  it("is monotone in ordered mode: a higher field never removes ink", () => {
    const low = markField(7, 16, 0.3);
    const high = markField(7, 16, 0.55);
    const a = ditherField(low, 16, 16);
    const b = ditherField(high, 16, 16);
    for (let i = 0; i < a.length; i++) if (a[i]) expect(b[i]).toBe(1);
    expect(ink(b)).toBeGreaterThan(ink(a));
  });

  it("rejects a field of the wrong length", () => {
    expect(() => ditherField([0, 1], 2, 2)).toThrow(/expected 4/);
  });
});

describe("marks", () => {
  it("are symmetric after mirroring and identical for the same seed", () => {
    const px = mirrorX(ditherField(markField(hash32("copilot"), 16, 0.3), 16, 16), 16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) expect(px[y * 16 + x]).toBe(px[y * 16 + 15 - x]);
    const again = mirrorX(ditherField(markField(hash32("copilot"), 16, 0.3), 16, 16), 16, 16);
    expect(again).toEqual(px);
    const other = mirrorX(ditherField(markField(hash32("blog"), 16, 0.3), 16, 16), 16, 16);
    expect(other).not.toEqual(px);
  });

  it("serialise each run as a stroke through its row, with relative moves", () => {
    const px = Uint8Array.from([1, 1, 0, 1, 0, 0, 1, 1]);
    expect(pixelsToSvg(px, 4, 2)).toContain('d="M0 0.5h2m1 0h1M2 1.5h2"');
    expect(pixelsToSvg(px, 4, 2, "#fff")).toContain('stroke="#fff"');
  });
});

describe("generatePlateFiles", () => {
  it("writes a resting and a hover plate per project, each under 3 KB", () => {
    const files = generatePlateFiles();
    const slugs = [...files.keys()].filter((n) => !n.endsWith(".hover.svg")).map((n) => n.replace(/\.svg$/, ""));
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const rest = files.get(`${slug}.svg`)!;
      const hover = files.get(`${slug}.hover.svg`)!;
      expect(rest.length).toBeLessThan(3072);
      expect(hover.length).toBeLessThan(3072);
      expect(rest).toMatch(/^<svg [^>]*viewBox="0 0 16 16"/);
    }
    expect(generatePlateFiles()).toEqual(files);
  });
});
