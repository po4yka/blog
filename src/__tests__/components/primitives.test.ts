import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Panel } from "@/components/ui/Panel";
import { Reveal } from "@/components/ui/Reveal";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("Reveal", () => {
  it("marks the element for the CSS fade and keeps it in its final state", () => {
    const out = html(createElement(Reveal, null, "x"));
    expect(out).toBe('<div data-reveal="base">x</div>');
    expect(out).not.toMatch(/opacity/);
  });

  it("turns a delay in seconds into --reveal-delay in ms and merges the caller style", () => {
    const out = html(createElement(Reveal, { delay: 0.12, speed: "slow", style: { lineHeight: 1.7 } }, "x"));
    expect(out).toContain('data-reveal="slow"');
    expect(out).toContain("line-height:1.7");
    expect(out).toContain("--reveal-delay:120ms");
  });

  it("renders as another element and forwards props", () => {
    const out = html(createElement(Reveal, { as: "p", className: "a", role: "note" }, "x"));
    expect(out).toBe('<p data-reveal="base" class="a" role="note">x</p>');
  });

  it("instant renders the element with no fade", () => {
    const out = html(createElement(Reveal, { instant: true, delay: 0.3, className: "a" }, "x"));
    expect(out).toBe('<div class="a">x</div>');
  });
});

describe("Panel", () => {
  it("defaults to a solid, clipped panel and appends the caller class", () => {
    expect(html(createElement(Panel, { className: "p-4" }))).toBe(
      '<div data-tone="solid" data-clip="hidden" class="panel p-4"></div>',
    );
  });

  it("passes tone and clip through, and composes with Reveal", () => {
    const out = html(createElement(Reveal, { as: Panel, tone: "translucent", clip: "clip", delay: 0.05 }));
    expect(out).toContain('data-tone="translucent"');
    expect(out).toContain('data-clip="clip"');
    expect(out).toContain('data-reveal="base"');
    expect(out).toContain('class="panel"');
  });
});

describe("primitives.css", () => {
  const css = readFileSync("src/styles/primitives.css", "utf8");
  const layer = css.slice(css.indexOf("@layer components"), css.lastIndexOf("@starting-style"));

  it("keeps the panel and reveal rules in the components layer, so caller utilities win", () => {
    expect(layer).toContain(".panel {");
    expect(layer).toContain("[data-reveal] {");
  });

  it("rests at opacity 1 and starts from 0 only in @starting-style", () => {
    expect(layer).toMatch(/\[data-reveal\] \{[^}]*opacity: 1;/);
    expect(css.slice(css.lastIndexOf("@starting-style"))).toMatch(/opacity: 0/);
  });

  it("uses the motion tokens", () => {
    expect(layer).toContain("var(--dur-base) var(--ease-out) var(--reveal-delay)");
    // Reset per element, so a nested Reveal never inherits a parent's delay.
    expect(layer).toMatch(/\[data-reveal\] \{[^}]*--reveal-delay: 0ms;/);
    expect(layer).toContain("var(--dur-fast)");
    expect(layer).toContain("var(--dur-slow)");
  });
});
