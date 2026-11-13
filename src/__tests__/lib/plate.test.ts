import { describe, expect, it } from "vitest";
import { PLATE_SIZE, plateArt, plateCaption, plateKind } from "@/lib/plate";

const cells = (d: string) => {
  const px = new Set<string>();
  for (const m of d.matchAll(/M(\d+) (\d+)\.5h(\d+)/g)) for (let i = 0; i < Number(m[3]); i++) px.add(`${Number(m[1]) + i},${m[2]}`);
  return px;
};

describe("plateKind and plateCaption", () => {
  it("takes the silhouette from the first platform and names both seeds", () => {
    expect(plateKind("Android")).toBe("android");
    expect(plateKind("Quantum")).toBe("other");
    expect(plateKind(undefined)).toBe("other");
    expect(plateCaption("copilot", "Backend")).toBe("backend · seed copilot");
  });
});

describe("plateArt", () => {
  it("is deterministic, mirrored, and differs between slugs of one kind", () => {
    const a = plateArt("ripdpi", "Android");
    expect(plateArt("ripdpi", "Android")).toEqual(a);
    expect(plateArt("anr-watchdog", "Android")).not.toEqual(a);
    const rest = cells(a.rest);
    for (const c of rest) {
      const [x, y] = c.split(",").map(Number);
      expect(rest.has(`${PLATE_SIZE - 1 - x!},${y}`)).toBe(true);
    }
  });

  it("keeps late pixels out of the rest mark, and gives each to one rank", () => {
    const { rest, late } = plateArt("heimdall", "Tooling");
    const restCells = cells(rest);
    const seen = new Set<string>();
    for (const d of late) {
      for (const c of cells(d)) {
        expect(restCells.has(c)).toBe(false);
        expect(seen.has(c)).toBe(false);
        seen.add(c);
      }
    }
    expect(seen.size).toBeGreaterThan(0);
  });
});
