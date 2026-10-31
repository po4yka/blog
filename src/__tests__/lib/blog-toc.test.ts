import { describe, expect, it } from "vitest";
import { TOC_MIN_ITEMS, activeSection, nestToc, tocFromHeadings } from "@/lib/blog/toc";

describe("tocFromHeadings", () => {
  it("keeps depth 2 and 3, trims text and strips the permalink '#'", () => {
    expect(
      tocFromHeadings([
        { depth: 1, slug: "t", text: "Title" },
        { depth: 2, slug: "a", text: "  One # " },
        { depth: 3, slug: "b", text: "Two" },
        { depth: 4, slug: "c", text: "Deep" },
      ]),
    ).toEqual([
      { id: "a", text: "One", level: 2 },
      { id: "b", text: "Two", level: 3 },
    ]);
    expect(tocFromHeadings([])).toEqual([]);
  });

  it("shows a TOC from three items", () => {
    expect(TOC_MIN_ITEMS).toBe(3);
  });
});

describe("nestToc", () => {
  const h2 = (id: string) => ({ id, text: id, level: 2 as const });
  const h3 = (id: string) => ({ id, text: id, level: 3 as const });

  it("nests h3 under the preceding h2 and keeps a leading h3 top level", () => {
    expect(nestToc([h3("x"), h2("a"), h3("b"), h3("c"), h2("d")])).toEqual([
      { item: h3("x"), children: [] },
      { item: h2("a"), children: [h3("b"), h3("c")] },
      { item: h2("d"), children: [] },
    ]);
  });
});

describe("activeSection", () => {
  const tops = [
    { id: "a", top: 100 },
    { id: "b", top: 500 },
    { id: "c", top: 900 },
  ];

  it("has no active item for an empty list or before the first heading", () => {
    expect(activeSection([], 300, false)).toEqual({ id: null, progress: 0 });
    expect(activeSection(tops, 50, false)).toEqual({ id: null, progress: 0 });
  });

  it("picks the last heading at or above the line, with progress to the next heading", () => {
    expect(activeSection(tops, 300, false)).toEqual({ id: "a", progress: 0.5 });
  });

  it("treats a heading exactly on the line as active with progress 0", () => {
    expect(activeSection(tops, 500, false)).toEqual({ id: "b", progress: 0 });
  });

  it("measures the last section to the end of the content", () => {
    expect(activeSection(tops, 1000, false, 1100)).toEqual({ id: "c", progress: 0.5 });
    expect(activeSection(tops, 1000, false)).toEqual({ id: "c", progress: 0 });
  });

  it("marks the last heading with full progress at the end of the page", () => {
    expect(activeSection(tops, 300, true)).toEqual({ id: "c", progress: 1 });
  });
});
