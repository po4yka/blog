import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { duration, ease, easeInOut } from "@/lib/motion";
import { THEME_COLORS } from "@/lib/themeColors";

const tokensCss = readFileSync("src/styles/tokens.css", "utf8");
const themeCss = readFileSync("src/styles/theme.css", "utf8");

function cssVar(css: string, name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`--${name} not found`);
  return match[1]!.trim();
}

function blockOf(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`${selector} block not found`);
  return css.slice(start, css.indexOf("}", start));
}

function declarations(block: string): string[] {
  return [...block.matchAll(/([a-z-]+:\s*[^;]+);/g)].map((m) => m[1]!.replace(/\s+/g, " "));
}

describe("motion tokens: CSS and TS agree", () => {
  it.each([
    ["dur-instant", duration.instant],
    ["dur-fast", duration.fast],
    ["dur-base", duration.base],
    ["dur-slow", duration.slow],
    ["dur-scene", duration.scene],
  ])("--%s equals duration in seconds", (name, seconds) => {
    expect(cssVar(tokensCss, name)).toBe(`${Math.round(seconds * 1000)}ms`);
  });

  it("--ease-out and --ease-in-out match the Motion cubic-beziers", () => {
    expect(cssVar(tokensCss, "ease-out")).toBe(`cubic-bezier(${ease.join(", ")})`);
    expect(cssVar(tokensCss, "ease-in-out")).toBe(`cubic-bezier(${easeInOut.join(", ")})`);
  });
});

describe("theme-color matches the page background", () => {
  it("dark and light", () => {
    expect(cssVar(blockOf(themeCss, ".dark"), "background")).toBe(THEME_COLORS.dark);
    expect(cssVar(blockOf(themeCss, ".light, :root:not(.dark)"), "background")).toBe(THEME_COLORS.light);
  });
});

describe("reduced motion", () => {
  it("the data-motion rule and the no-JS @media rule set the same declarations", () => {
    const attr = blockOf(tokensCss, ':root[data-motion="reduce"] *::after');
    const media = blockOf(tokensCss.slice(tokensCss.indexOf("@media (prefers-reduced-motion: reduce)")), "*::after");
    expect(declarations(attr).length).toBeGreaterThan(0);
    expect(declarations(media)).toEqual(declarations(attr));
  });
});
