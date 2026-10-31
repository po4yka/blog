import { describe, expect, it } from "vitest";
import { filterItems, type PaletteItem } from "@/lib/palette";

const items: PaletteItem[] = [
  { id: "a1", group: "actions", title: "Theme: dark", command: "theme dark" },
  { id: "s1", group: "sections", title: "Selected Projects", command: "jump projects-heading" },
  { id: "p1", group: "pages", title: "Projects", command: "open projects" },
  { id: "b1", group: "posts", title: "Why RAG breaks early", command: "open rag-breaks", keywords: ["rag-breaks", "LLM"] },
  { id: "b2", group: "posts", title: "Diagnosing networks", command: "open network-diag", keywords: ["DPI"] },
];

const ids = (q: string) => filterItems(items, q).map((i) => i.id);

describe("filterItems", () => {
  it("keeps every item for an empty query, in group order", () => {
    expect(ids("  ")).toEqual(["p1", "b1", "b2", "a1", "s1"]);
  });

  it("matches title, command text, slug and tags case-insensitively", () => {
    expect(ids("DIAGNOSING")).toEqual(["b2"]);
    expect(ids("open rag")).toEqual(["b1"]);
    expect(ids("rag-breaks")).toEqual(["b1"]);
    expect(ids("dpi")).toEqual(["b2"]);
    expect(ids("llm")).toEqual(["b1"]);
  });

  it("keeps group order and ranks a prefix match before a substring match inside a group", () => {
    // "projects": page (prefix) then section (title prefix too), groups stay ordered
    expect(ids("projects")).toEqual(["p1", "s1"]);
    const two: PaletteItem[] = [
      { id: "x", group: "posts", title: "About theme", command: "open x" },
      { id: "y", group: "posts", title: "Theme notes", command: "open y" },
    ];
    expect(filterItems(two, "theme").map((i) => i.id)).toEqual(["y", "x"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(ids("zzzz")).toEqual([]);
  });
});
