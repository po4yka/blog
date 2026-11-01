import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  collectInlineScriptHashes,
  injectScriptHashes,
  MAX_HEADER_LINE,
} from "../../../scripts/inject-csp-hashes";

const hash = (s: string) => `'sha256-${createHash("sha256").update(s).digest("base64")}'`;

describe("collectInlineScriptHashes", () => {
  it("hashes the exact text of inline classic and module scripts", () => {
    const html = `<script>var a = 1;</script><script type="module">import "x";\n</script>`;
    expect(collectInlineScriptHashes(html)).toEqual(
      new Set([hash("var a = 1;"), hash('import "x";\n')]),
    );
  });

  it("skips src, JSON-LD, empty and other non-JS scripts", () => {
    const html = [
      `<script src="/m.js"></script>`,
      `<script type="application/ld+json">{"a":1}</script>`,
      `<script type="speculationrules">{}</script>`,
      `<script>  </script>`,
    ].join("");
    expect(collectInlineScriptHashes(html).size).toBe(0);
  });
});

describe("injectScriptHashes", () => {
  const headers = "/*\n  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'\n";

  it("replaces only the script-src unsafe-inline", () => {
    const out = injectScriptHashes(headers, ["'sha256-b'", "'sha256-a'"]);
    expect(out).toContain("script-src 'self' 'sha256-a' 'sha256-b'; style-src 'self' 'unsafe-inline'");
  });

  it("throws when there is no unsafe-inline to replace", () => {
    expect(() => injectScriptHashes("/*\n  X: y\n", [])).toThrow();
  });

  it("throws when a line exceeds the Cloudflare limit", () => {
    const many = Array.from({ length: 60 }, (_, i) => `'sha256-${String(i).padStart(44, "x")}'`);
    expect(many.join(" ").length).toBeGreaterThan(MAX_HEADER_LINE);
    expect(() => injectScriptHashes(headers, many)).toThrow(/limit/);
  });
});
