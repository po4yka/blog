import { describe, expect, it } from "vitest";
import { COVER_H, COVER_W, coverArt, coverCaption, coverLayout, coverPixels, coverReadPosition, coverSections, formatOutline, parseOutline } from "@/lib/cover";
import { readBlogPosts } from "../../../scripts/generate-blog-data";
import { articleOutline, countWords } from "../../../scripts/generate-blog-data";

const base = "h2 p30 c8 h3 p12 f14 h2 l9 p20";
const column = (px: Uint8Array, x: number) => Array.from({ length: COVER_H }, (_, y) => px[y * COVER_W + x]!);
const ink = (px: ArrayLike<number>) => Array.from(px).reduce((n, v) => n + v, 0);

describe("articleOutline", () => {
  it("lists headings, prose, lists, code and figures in reading order", () => {
    const md = [
      'import BlogFigure from "../../components/BlogFigure.astro";',
      "# Title is skipped",
      "intro text",
      "## One",
      "one two three four five six seven eight nine ten eleven twelve",
      "",
      "- first item",
      "- second item",
      "",
      "```sh",
      "## not a heading",
      "echo hi",
      "```",
      "### Two",
      "<BlogFigure",
      '  alt="a figure"',
      "/>",
      "<BlogFigure",
      '  alt="another"',
      "/>",
    ].join("\n");
    expect(formatOutline(articleOutline(md))).toBe("p1 h2 p2 l3 c4 h3 f14 f14");
  });

  it("skips headings inside tilde and longer backtick fences", () => {
    expect(formatOutline(articleOutline("~~~\n## not a heading\n~~~\n\n## Real"))).toBe("c3 h2");
    expect(formatOutline(articleOutline("````md\n```js\nx\n```\n````\n\n## Real"))).toBe("c5 h2");
  });

  it("ends a paragraph at a figure or fence with no blank line before it", () => {
    expect(formatOutline(articleOutline("text\n<BlogFigure />\nmore"))).toBe("p1 f14 p1");
  });

  it("merges neighbouring prose paragraphs", () => {
    expect(formatOutline(articleOutline("one\n\ntwo\n\nthree"))).toBe("p3");
  });

  it("counts Cyrillic words, not only Latin ones", () => {
    expect(countWords("Сеть не сломана, она просто здесь")).toBe(6);
    expect(countWords("RAG ломается раньше, чем кажется")).toBe(5);
    expect(countWords("code `inline` stays out\n```\nfenced block\n```")).toBe(3);
  });
});

describe("coverLayout", () => {
  it("fills the width exactly, one column per heading and a paper column between blocks", () => {
    const spans = coverLayout(parseOutline(base));
    expect(spans[spans.length - 1]!.x1).toBe(COVER_W);
    for (const s of spans.filter((s) => s.kind === "h")) expect(s.x1 - s.x0).toBe(1);
    for (let i = 1; i < spans.length; i++) expect(spans[i]!.x0 - spans[i - 1]!.x1).toBe(1);
  });

  it("keeps every block of every real post at least three columns wide", () => {
    for (const { outline } of readBlogPosts()) {
      const spans = coverLayout(parseOutline(outline));
      expect(spans[spans.length - 1]!.x1).toBe(COVER_W);
      for (const s of spans.filter((s) => s.kind !== "h")) expect(s.x1 - s.x0).toBeGreaterThanOrEqual(3);
    }
  });

  it("gives a longer block more columns, and a short one at least three", () => {
    const spans = coverLayout(parseOutline("p40 c10 p1"));
    const width = (i: number) => spans[i]!.x1 - spans[i]!.x0;
    expect(width(0)).toBeGreaterThan(3 * width(1));
    expect(width(2)).toBeGreaterThanOrEqual(3);
  });
});

describe("coverPixels", () => {
  it("is deterministic and follows the outline", () => {
    expect(coverPixels(base)).toEqual(coverPixels(base));
    expect(coverPixels("h2 p30 c8")).not.toEqual(coverPixels(base));
  });

  it("draws an h2 as a full-height rule and an h3 as a shorter one", () => {
    const px = coverPixels(base);
    const [h2, , , h3] = coverLayout(parseOutline(base));
    expect(column(px, h2!.x0)).toEqual(new Array(COVER_H).fill(1));
    expect(column(px, h3!.x0).slice(0, 3)).toEqual([0, 0, 0]);
    expect(column(px, h3!.x0)[COVER_H - 1]).toBe(1);
  });

  it("draws code denser than prose, and a figure as an empty frame", () => {
    const px = coverPixels("p20 c20 f14");
    const [p, c, f] = coverLayout(parseOutline("p20 c20 f14"));
    const area = (s: { x0: number; x1: number }) => Array.from({ length: COVER_H }, (_, y) => px.slice(y * COVER_W + s.x0, y * COVER_W + s.x1)).flatMap((r) => Array.from(r));
    expect(ink(area(c!))).toBeGreaterThan(ink(area(p!)));
    const inside = column(px, Math.floor((f!.x0 + f!.x1) / 2));
    expect(inside[COVER_H - 1]).toBe(1);
    expect(inside.slice(6, COVER_H - 1)).toEqual(new Array(COVER_H - 7).fill(0));
  });

  it("puts the section numbers at the h2 columns", () => {
    const spans = coverLayout(parseOutline(base)).filter((s) => s.kind === "h" && s.n === 2);
    expect(coverSections(base)).toEqual(spans.map((s) => s.x0));
  });
});

describe("coverArt", () => {
  it("splits exactly the pixels of coverPixels into ranks and strokes", () => {
    for (const { outline } of [{ outline: base }, ...readBlogPosts()]) {
      const px = new Uint8Array(COVER_W * COVER_H);
      for (const b of coverArt(outline)) {
        for (const d of b.ranks) for (const m of d.matchAll(/M(\d+) (\d+)\.5h(\d+)/g)) px.fill(1, Number(m[2]) * COVER_W + Number(m[1]), Number(m[2]) * COVER_W + Number(m[1]) + Number(m[3]));
        // A rule or a frame covers its columns at the rows coverPixels inks.
        if (b.kind === "h" || b.kind === "f") for (let y = 0; y < COVER_H; y++) for (let x = b.x0; x < b.x1; x++) if (coverPixels(outline)[y * COVER_W + x]) px[y * COVER_W + x] = 1;
      }
      expect(px).toEqual(coverPixels(outline));
    }
  });

  it("numbers sections from the first h2 and figures in reading order", () => {
    const art = coverArt("p4 f14 h2 p3 f14 h2 c4");
    expect(art.map((b) => b.section)).toEqual([-1, -1, 0, 0, 0, 1, 1]);
    expect(art.map((b) => b.figure)).toEqual([-1, 0, -1, -1, 1, -1, -1]);
  });

  it("puts sparse pixels in early ranks: prose stops at rank 2, code reaches rank 5", () => {
    const [p, c] = coverArt("p40 c40");
    expect(p!.ranks.slice(3).every((d) => d === "")).toBe(true);
    expect(c!.ranks[5]).not.toBe("");
    expect(c!.ranks.slice(6).every((d) => d === "")).toBe(true);
  });
});

describe("coverReadPosition", () => {
  const anchors = [
    { top: 100, x: 0 },
    { top: 300, x: 0.2 },
    { top: 1300, x: 1 },
  ];
  it("is 0 above the content, 1 below it, and linear inside each section", () => {
    expect(coverReadPosition(50, anchors)).toBe(0);
    expect(coverReadPosition(200, anchors)).toBeCloseTo(0.1, 5);
    expect(coverReadPosition(800, anchors)).toBeCloseTo(0.6, 5);
    expect(coverReadPosition(2000, anchors)).toBe(1);
    expect(coverReadPosition(10, [])).toBe(0);
  });
});

describe("coverCaption", () => {
  it("names what the cover draws, with localized plurals, and leaves out kinds the post lacks", () => {
    expect(coverCaption({ wordCount: 1840, outline: base }, "en")).toBe("1840 words, 2 sections, 1 figure, 1 code block");
    expect(coverCaption({ wordCount: 21, outline: "h2 p2" }, "en")).toBe("21 words, 1 section");
    expect(coverCaption({ wordCount: 2245, outline: "h2 f14 f14 c4 c4 c4 c4 c4 h2 h2 h2 h2" }, "ru")).toBe(
      "2245 слов, 5 разделов, 2 рисунка, 5 блоков кода",
    );
  });
});
