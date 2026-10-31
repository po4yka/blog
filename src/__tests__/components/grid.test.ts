import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyToDOM, useSettingsStore } from "@/stores/settingsStore";

const scrollCss = readFileSync("src/styles/scroll.css", "utf8");
const gridCss = readFileSync("src/styles/grid.css", "utf8");
const tokensCss = readFileSync("src/styles/tokens.css", "utf8");

describe("scroll.css", () => {
  it("draws rules on scroll only where view() exists, motion is allowed and not turned off", () => {
    const supports = scrollCss.indexOf("@supports (animation-timeline: view())");
    const media = scrollCss.indexOf("@media screen and (prefers-reduced-motion: no-preference)");
    const subject = scrollCss.indexOf("view-timeline: --section-rule block;");
    const rule = scrollCss.indexOf(':root:not([data-motion="reduce"]) .rule-scroll');
    const timeline = scrollCss.indexOf("animation-timeline: --section-rule;");
    expect(supports).toBeGreaterThanOrEqual(0);
    expect(media).toBeGreaterThan(supports);
    expect(subject).toBeGreaterThan(media);
    expect(rule).toBeGreaterThan(subject);
    expect(timeline).toBeGreaterThan(rule);
    // The 1px rule is never its own subject: that would give a sub-pixel scroll range.
    expect(scrollCss).not.toMatch(/animation-timeline:\s*view\(\);/);
  });
});

describe("tokens.css grid", () => {
  it("defines the 1240px shell and the guide tokens", () => {
    expect(tokensCss).toContain("--grid-max: 1240px;");
    expect(tokensCss).toContain("--grid-cols: 12;");
    expect(tokensCss).toContain("--mark-size: 7px;");
    expect(tokensCss).toMatch(/--grid-line: color-mix\(/);
  });

  it("steps the gutter like the old px-6 md:px-10 lg:px-12", () => {
    expect(tokensCss).toMatch(/--grid-pad: 1\.5rem;/);
    expect(tokensCss).toMatch(/min-width: 768px\)[^}]*--grid-pad: 2\.5rem;/);
    expect(tokensCss).toMatch(/min-width: 1024px\)[^}]*--grid-pad: 3rem;/);
  });
});

describe("grid.css", () => {
  it("shows guides only from 1024px", () => {
    const wide = gridCss.indexOf("@media (min-width: 1024px)");
    expect(wide).toBeGreaterThan(0);
    expect(gridCss.indexOf("display: block;")).toBeGreaterThan(wide);
  });

  it("hides guides and marks for the toggle, print and forced colors", () => {
    expect(gridCss).toContain('html[data-grid="off"] .grid-guides');
    expect(gridCss).toContain('html[data-grid="off"] .reg-marks::before');
    expect(gridCss).toMatch(/@media print, \(forced-colors: active\) \{[^@]*\.grid-guides[^@]*display: none;/);
  });
});

describe("gridGuides preference", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("defaults to on", () => {
    expect(useSettingsStore.getState().gridGuides).toBe(true);
  });

  it("applyToDOM sets data-grid=off when off and removes it when on", () => {
    const dataset: Record<string, string> = {};
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("document", {
      documentElement: {
        dataset,
        classList: { toggle: () => false },
        style: { setProperty: () => {} },
        setAttribute: () => {},
        removeAttribute: () => {},
      },
      querySelector: () => null,
      createElement: () => ({ setAttribute: () => {} }),
      head: { appendChild: () => {} },
    });
    const base = { theme: "light", reduceMotion: false, fontSize: "default" } as const;
    applyToDOM({ ...base, gridGuides: false });
    expect(dataset.grid).toBe("off");
    applyToDOM({ ...base, gridGuides: true });
    expect(dataset.grid).toBeUndefined();
  });
});
