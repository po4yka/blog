import { describe, expect, it } from "vitest";
import { compareNewestFirst, parseDateLabel, postIsoDate } from "@/lib/blog/dates";

describe("postIsoDate", () => {
  it("uses publishedAt when the frontmatter has one", () => {
    expect(postIsoDate({ date: "Jun 2026", publishedAt: new Date("2026-06-18") })).toBe("2026-06-18");
    expect(postIsoDate({ date: "Jun 2026", publishedAt: "2026-06-18" })).toBe("2026-06-18");
  });

  it("falls back to the first day of the label, independent of the time zone", () => {
    expect(postIsoDate({ date: "Jun 2026" })).toBe("2026-06-01");
    expect(postIsoDate({ date: "Sep 2025", publishedAt: "not a date" })).toBe("2025-09-01");
  });

  it("returns null for a label it cannot read", () => {
    expect(postIsoDate({ date: "June 2026" })).toBeNull();
    for (const label of ["Jun ", "Jun 0x7E2", "Jun 2026.0", "jun 2026"]) expect(parseDateLabel(label), label).toBeNull();
    expect(parseDateLabel("Jun")).toBeNull();
  });
});

describe("compareNewestFirst", () => {
  it("orders by day, not by the label text, and breaks ties by slug", () => {
    const posts = [
      { slug: "b", isoDate: "2026-06-01" },
      { slug: "old", isoDate: "2025-09-01" },
      { slug: "a", isoDate: "2026-06-01" },
      { slug: "new", isoDate: "2026-06-18" },
    ];
    expect(posts.sort(compareNewestFirst).map((p) => p.slug)).toEqual(["new", "a", "b", "old"]);
  });
});
