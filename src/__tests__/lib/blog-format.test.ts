import { describe, expect, it } from "vitest";
import {
  alsoAsLinks,
  countReadingMinutes,
  formatIsoDate,
  isUpdated,
  markdownUrl,
  pickRelated,
} from "@/lib/blog/format";

const words = (n: number) => Array.from({ length: n }, () => "w").join(" ");

describe("formatIsoDate", () => {
  it("formats year and month", () => {
    expect(formatIsoDate("2026-04-01")).toBe("Apr 2026");
    expect(formatIsoDate("2026-12-31")).toBe("Dec 2026");
  });

  it("returns malformed input unchanged", () => {
    for (const bad of ["2026", "2026-13-01", "2026-00-01", "2026-ab"]) expect(formatIsoDate(bad)).toBe(bad);
  });
});

describe("countReadingMinutes", () => {
  it("is at least 1 and rounds at 220 words per minute", () => {
    expect(countReadingMinutes("")).toBe(1);
    expect(countReadingMinutes(words(220))).toBe(1);
    expect(countReadingMinutes(words(330))).toBe(2);
    expect(countReadingMinutes(words(660))).toBe(3);
  });
});

describe("markdownUrl and alsoAsLinks", () => {
  it("builds the markdown path per language", () => {
    expect(markdownUrl("a", "en")).toBe("/blog/a.md");
    expect(markdownUrl("a", "ru")).toBe("/blog/ru/a.md");
  });

  it("uses markdownUrl for the markdown twin and the language feed for rss", () => {
    expect(alsoAsLinks("a", "en")).toEqual([
      { label: "markdown", href: markdownUrl("a", "en") },
      { label: "rss", href: "/rss.xml" },
      { label: "llms-full.txt", href: "/llms-full.txt" },
    ]);
    const ru = alsoAsLinks("a", "ru");
    expect(ru[0]?.href).toBe("/blog/ru/a.md");
    expect(ru[1]?.href).toBe("/rss.ru.xml");
  });
});

describe("isUpdated", () => {
  it("is a boolean true only when the modified date differs", () => {
    expect(isUpdated({ isoDate: "2026-01-01" })).toBe(false);
    expect(isUpdated({ isoDate: "2026-01-01", isoDateModified: "2026-01-01" })).toBe(false);
    expect(isUpdated({ isoDate: "2026-01-01", isoDateModified: "2026-02-01" })).toBe(true);
  });
});

describe("pickRelated", () => {
  it("needs at least two items and caps at three", () => {
    expect(pickRelated(undefined)).toEqual([]);
    expect(pickRelated([1])).toEqual([]);
    expect(pickRelated([1, 2])).toEqual([1, 2]);
    expect(pickRelated([1, 2, 3, 4, 5])).toEqual([1, 2, 3]);
  });
});
