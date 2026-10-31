import { describe, expect, it } from "vitest";
import { TOC_MIN_ITEMS, pickActiveId, toTocItems } from "@/lib/blog/toc";

describe("toTocItems", () => {
  it("maps H2 to level 2, anything else to level 3, and trims text", () => {
    expect(
      toTocItems([
        { id: "a", tagName: "H2", text: "  One " },
        { id: "b", tagName: "H3", text: "Two" },
      ]),
    ).toEqual([
      { id: "a", text: "One", level: 2 },
      { id: "b", text: "Two", level: 3 },
    ]);
    expect(toTocItems([])).toEqual([]);
  });

  it("shows a TOC from three items", () => {
    expect(TOC_MIN_ITEMS).toBe(3);
  });
});

describe("pickActiveId", () => {
  it("picks the intersecting entry nearest the top, ignoring input order", () => {
    expect(
      pickActiveId([
        { isIntersecting: true, top: 300, id: "c" },
        { isIntersecting: false, top: -10, id: "x" },
        { isIntersecting: true, top: 100, id: "b" },
      ]),
    ).toBe("b");
  });

  it("returns null when nothing intersects or the list is empty", () => {
    expect(pickActiveId([{ isIntersecting: false, top: 0, id: "a" }])).toBeNull();
    expect(pickActiveId([])).toBeNull();
  });

  it("keeps the first entry on equal top (stable sort)", () => {
    expect(
      pickActiveId([
        { isIntersecting: true, top: 50, id: "first" },
        { isIntersecting: true, top: 50, id: "second" },
      ]),
    ).toBe("first");
  });
});
