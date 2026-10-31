import { describe, expect, it } from "vitest";

import {
  DARK_QUERY,
  MOBILE_QUERY,
  parseFigParam,
  parseSource,
  pickVariant,
  resolveCaption,
  swipeDirection,
  wrapIndex,
  type RawSource,
  type VariantSource,
} from "@/lib/blog/lightbox";

// Mirrors the <source> list BlogFigure.astro emits: ART_DIRECTIONS order
// (dark+mobile, mobile, dark desktop) x FORMATS order (avif, webp, png).
const DIRECTIONS = [
  { media: "(prefers-color-scheme: dark) and (max-width: 640px)", theme: "dark", viewport: "mobile", key: "md" },
  { media: "(max-width: 640px)", theme: "light", viewport: "mobile", key: "ml" },
  { media: "(prefers-color-scheme: dark)", theme: "dark", viewport: "desktop", key: "dd" },
] as const;

function blogFigureRaw(withData = true): RawSource[] {
  return DIRECTIONS.flatMap((d) =>
    (["avif", "webp", "png"] as const).map((f) => ({
      srcset: `/${d.key}.${f}`,
      type: `image/${f}`,
      media: d.media,
      ...(withData ? { theme: d.theme, viewport: d.viewport } : {}),
    })),
  );
}

function parseAll(raws: RawSource[]): VariantSource[] {
  return raws.map(parseSource).filter((s): s is VariantSource => s !== null);
}

describe("parseSource", () => {
  it("reads data-theme / data-viewport from BlogFigure sources", () => {
    const [md, , , ml, , , dd] = [0, 1, 2, 3, 4, 5, 6].map((i) => parseSource(blogFigureRaw()[i]!)!);
    expect(md).toMatchObject({ requiresDark: true, requiresMobile: true, mimeType: "image/avif" });
    expect(ml).toMatchObject({ requiresDark: false, requiresMobile: true });
    expect(dd).toMatchObject({ requiresDark: true, requiresMobile: false });
  });

  it("falls back to the media regex when data attributes are absent", () => {
    const raws = blogFigureRaw(false);
    expect(parseSource(raws[0]!)).toMatchObject({ requiresDark: true, requiresMobile: true });
    expect(parseSource(raws[3]!)).toMatchObject({ requiresDark: false, requiresMobile: true });
    expect(parseSource(raws[6]!)).toMatchObject({ requiresDark: true, requiresMobile: false });
  });

  it("lets data attributes win over media", () => {
    const s = parseSource({ srcset: "/a", media: "(max-width: 640px)", type: null, theme: "light", viewport: "desktop" });
    expect(s).toEqual({ srcset: "/a", requiresDark: false, requiresMobile: false, mimeType: null });
  });

  it("drops sources with an empty srcset", () => {
    expect(parseSource({ srcset: "", media: "", type: null })).toBeNull();
  });

  it("exports the media queries", () => {
    expect(MOBILE_QUERY).toBe("(max-width: 640px)");
    expect(DARK_QUERY).toBe("(prefers-color-scheme: dark)");
  });
});

describe("pickVariant", () => {
  const figure = { sources: parseAll(blogFigureRaw()), fallbackSrc: "/fallback.png" };

  it("light desktop matches nothing and uses the fallback src", () => {
    expect(pickVariant(figure, false, false)).toBe("/fallback.png");
  });

  it("dark desktop picks the dark desktop png", () => {
    expect(pickVariant(figure, true, false)).toBe("/dd.png");
  });

  it("light mobile picks the mobile light png", () => {
    expect(pickVariant(figure, false, true)).toBe("/ml.png");
  });

  it("dark mobile depends on source order: the dark+mobile source comes first", () => {
    expect(pickVariant(figure, true, true)).toBe("/md.png");
    const reversed = { ...figure, sources: [...figure.sources].reverse() };
    // reversed order puts dark desktop (also matching) ahead of dark+mobile
    expect(pickVariant(reversed, true, true)).toBe("/dd.png");
  });

  it("uses the first match when there is no PNG", () => {
    const noPng = { ...figure, sources: figure.sources.filter((s) => s.mimeType !== "image/png") };
    expect(pickVariant(noPng, true, false)).toBe("/dd.avif");
  });

  it("treats a source without a type as PNG-compatible", () => {
    const s = parseSource({ srcset: "/raw.jpg", media: "", type: null })!;
    expect(pickVariant({ sources: [s], fallbackSrc: "/f" }, false, false)).toBe("/raw.jpg");
  });
});

describe("resolveCaption", () => {
  it("prefers figcaption text", () => {
    expect(resolveCaption({ alt: "alt", figcaptionText: "FIG 02Caption", siblingText: "sib" })).toBe("FIG 02Caption");
  });

  it("falls back to the sibling paragraph when the figcaption is empty or missing", () => {
    expect(resolveCaption({ alt: "alt", figcaptionText: "", siblingText: "sib" })).toBe("sib");
    expect(resolveCaption({ alt: "alt", figcaptionText: undefined, siblingText: "sib" })).toBe("sib");
  });

  it("falls back to alt when there is no usable text", () => {
    expect(resolveCaption({ alt: "alt", figcaptionText: undefined, siblingText: "" })).toBe("alt");
  });

  it("returns alt for an image outside a <picture> even with a sibling <p> (reader passes null)", () => {
    expect(resolveCaption({ alt: "alt", figcaptionText: undefined, siblingText: null })).toBe("alt");
  });
});

describe("parseFigParam", () => {
  it("converts 1-indexed to 0-indexed", () => {
    expect(parseFigParam("1", 3)).toBe(0);
    expect(parseFigParam("3", 3)).toBe(2);
  });

  it("rejects missing, out-of-range and non-numeric values", () => {
    expect(parseFigParam(null, 3)).toBeNull();
    expect(parseFigParam("0", 3)).toBeNull();
    expect(parseFigParam("4", 3)).toBeNull();
    expect(parseFigParam("abc", 3)).toBeNull();
    expect(parseFigParam("", 3)).toBeNull();
  });

  it("parses a leading integer like parseInt", () => {
    expect(parseFigParam("2x", 3)).toBe(1);
  });
});

describe("wrapIndex", () => {
  it("wraps in both directions", () => {
    expect(wrapIndex(0, -1, 4)).toBe(3);
    expect(wrapIndex(3, 1, 4)).toBe(0);
    expect(wrapIndex(1, 1, 4)).toBe(2);
  });
});

describe("swipeDirection", () => {
  it("swipes next on a long left drag or a fast left flick", () => {
    expect(swipeDirection(-81, 0)).toBe(1);
    expect(swipeDirection(0, -501)).toBe(1);
  });

  it("swipes previous on a long right drag or a fast right flick", () => {
    expect(swipeDirection(81, 0)).toBe(-1);
    expect(swipeDirection(0, 501)).toBe(-1);
  });

  it("ignores movement at or below the thresholds", () => {
    expect(swipeDirection(-80, -500)).toBe(0);
    expect(swipeDirection(80, 500)).toBe(0);
  });

  it("checks the negative side first in the mixed case", () => {
    expect(swipeDirection(-90, 600)).toBe(1);
    expect(swipeDirection(90, -600)).toBe(1);
  });
});
