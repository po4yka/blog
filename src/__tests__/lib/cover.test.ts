import { describe, expect, it } from "vitest";
import { COVER_H, COVER_W, coverCaption, coverField, coverPixels, type CoverInput } from "@/lib/cover";
import { countWords, headingDepths } from "../../../scripts/generate-blog-data";
import { generateCoverFiles } from "../../../scripts/generate-covers";

const base: CoverInput = { slug: "some-post", wordCount: 1840, headings: [2, 3, 2], isoDate: "2026-04-01" };
const ink = (p: Uint8Array) => p.reduce((n, v) => n + v, 0);

describe("cover inputs from MDX", () => {
  it("lists heading depths in order and skips fenced code", () => {
    const md = "intro\n\n## One\n\ntext\n\n```sh\n## not a heading\n```\n\n### Two\n\n#### Three\n# Title is skipped\n";
    expect(headingDepths(md)).toEqual([2, 3, 4]);
  });

  it("counts Cyrillic words, not only Latin ones", () => {
    expect(countWords("Сеть не сломана, она просто здесь")).toBe(6);
    expect(countWords("RAG ломается раньше, чем кажется")).toBe(5);
    expect(countWords("code `inline` stays out\n```\nfenced block\n```")).toBe(3);
  });
});

describe("coverField", () => {
  it("gives the same pixels for the same input and different pixels for another slug", () => {
    expect(coverPixels(base)).toEqual(coverPixels({ ...base }));
    expect(coverPixels({ ...base, slug: "other-post" })).not.toEqual(coverPixels(base));
  });

  it("uses every input: date, word count and headings change the cover", () => {
    const px = coverPixels(base);
    expect(coverPixels({ ...base, isoDate: "2026-09-15" })).not.toEqual(px);
    expect(coverPixels({ ...base, headings: [2, 2, 2, 2] })).not.toEqual(px);
    expect(ink(coverPixels({ ...base, wordCount: 4000 }))).toBeGreaterThan(ink(coverPixels({ ...base, wordCount: 300 })));
  });

  it("draws one band per heading: paper between bands and above a deeper heading", () => {
    const field = coverField(base);
    const bandWidth = COVER_W / 3;
    const column = (x: number) => Array.from({ length: COVER_H }, (_, y) => field[y * COVER_W + x]!);
    // The gap before band 2 and band 3 is empty.
    expect(column(Math.floor(bandWidth))).toEqual(new Array(COVER_H).fill(0));
    expect(column(Math.floor(2 * bandWidth))).toEqual(new Array(COVER_H).fill(0));
    // The h3 band (middle) starts below the top; the h2 bands reach row 0.
    const mid = Math.floor(1.5 * bandWidth);
    expect(column(mid).slice(0, 4)).toEqual([0, 0, 0, 0]);
    expect(Math.max(...Array.from({ length: Math.floor(bandWidth) - 2 }, (_, x) => field[x]!))).toBeGreaterThan(0);
  });

  it("never asks for solid ink, so every region keeps a dither texture", () => {
    expect(Math.max(...coverField({ ...base, wordCount: 20_000 }))).toBeCloseTo(0.85, 5);
  });
});

describe("coverCaption", () => {
  it("names every input, with localized plurals", () => {
    expect(coverCaption(base, "en")).toBe("some-post, 1840 words, 3 headings, 2026-04-01");
    expect(coverCaption({ ...base, wordCount: 21, headings: [2] }, "en")).toBe("some-post, 21 words, 1 heading, 2026-04-01");
    expect(coverCaption({ ...base, wordCount: 2245, headings: [2, 2, 2, 2, 2] }, "ru")).toBe("some-post, 2245 слов, 5 заголовков, 2026-04-01");
    expect(coverCaption({ ...base, wordCount: 3884, headings: [2, 2, 3] }, "ru")).toBe("some-post, 3884 слова, 3 заголовка, 2026-04-01");
  });
});

describe("generateCoverFiles", () => {
  it("writes one cover per post and language, each under 10 KB, identical on a second run", () => {
    const files = generateCoverFiles();
    expect(files.size).toBeGreaterThan(0);
    for (const [name, svg] of files) {
      expect(name).toMatch(/^(en|ru)-[\w-]+\.svg$/);
      expect(svg.length).toBeLessThan(10_240);
      expect(svg).toContain(`viewBox="0 0 ${COVER_W} ${COVER_H}"`);
    }
    expect(generateCoverFiles()).toEqual(files);
  });
});
