import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeroText } from "@/components/Hero/HeroText";
import { HeroWhois } from "@/components/Hero/HeroWhois";

const out = renderToStaticMarkup(createElement(HeroText));
const h1 = out.match(/<h1[^>]*>.*?<\/h1>/s)?.[0] ?? "";

describe("HeroText", () => {
  it("renders the h1 with both language names and two word spans each", () => {
    expect(h1).toContain('id="hero-heading"');
    for (const [lang, given, family] of [
      ["en", "Nikita", "Pochaev"],
      ["ru", "Никита", "Почаев"],
    ] as const) {
      const span = h1.match(new RegExp(`<span data-l="${lang}"[^>]*>(.*?</span>)</span>`, "s"))?.[1] ?? "";
      expect(span.match(/<span class="block/g)).toHaveLength(2);
      expect(span).toContain(`>${given}</span> <span`);
      expect(span).toContain(`>${family}</span>`);
    }
  });

  it("never fades the h1: no data-reveal on it or on its container", () => {
    expect(h1).not.toContain("data-reveal");
    expect(out.startsWith('<div class="lg:col-span-7')).toBe(true);
  });

  it("keeps the CTA hrefs, analytics attributes and external-link rel", () => {
    for (const [href, target] of [
      ["/blog", "blog"],
      ["/projects", "projects"],
      ["https://github.com/po4yka", "github"],
    ]) {
      const a = out.match(new RegExp(`<a [^>]*data-umami-event-target="${target}"[^>]*>`))?.[0] ?? "";
      expect(a).toContain(`href="${href}"`);
      expect(a).toContain('data-umami-event="hero-cta"');
    }
    expect(out).toContain('target="_blank" rel="noopener noreferrer"');
  });

  it("renders the whois sheet as static text with no click-to-copy control", () => {
    const whois = renderToStaticMarkup(createElement(HeroWhois));
    expect(whois).toContain("identity.md");
    expect(whois).not.toContain('role="button"');
    expect(whois).not.toContain("click to copy");
    expect(whois.match(/data-l="(en|ru)"/g)).toHaveLength(2);
  });

  it("fades the small lines but not the LCP candidates (name and intro)", () => {
    // label, subtitle, meta strip, CTAs
    expect(out.match(/data-reveal/g)?.length).toBe(4);
    const introTag = out.match(/<p[^>]*class="font-sans[^"]*"[^>]*>/)?.[0];
    expect(introTag).toBeDefined();
    expect(introTag).not.toContain("data-reveal");
  });
});
