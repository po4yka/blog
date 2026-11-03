import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Mechanical checks for the bans in DESIGN.md. One test per rule.
 * The scan covers src/**\/*.{ts,tsx,astro,css,mdx}. It skips src/data/ (generated)
 * and src/__tests__/. Comments are removed before the class and CSS scans, so
 * prose such as "no shadow" does not count. Emoji are checked in the raw text.
 *
 * An exception needs an entry in ALLOWED with the rule, the file, a text
 * snippet of the line, and the DESIGN.md reason. Add an entry only for
 * something DESIGN.md documents. Fix any other hit in the source.
 */

const ROOT = "src";
const EXTENSIONS = /\.(ts|tsx|astro|css|mdx)$/;
const SKIPPED_DIRS = [`src${sep}data`, `src${sep}__tests__`];

type RuleId =
  | "shadow"
  | "radius"
  | "gradient"
  | "transition-all"
  | "hover-geometry"
  | "ambient-loop"
  | "legacy-token"
  | "font-family"
  | "emoji";

interface Allowed {
  rule: RuleId;
  file: string;
  /** Text that must appear in the offending line. */
  snippet: string;
  reason: string;
}

const ALLOWED: Allowed[] = [
  {
    rule: "gradient",
    file: "src/styles/theme.css",
    snippet: "mask-image: linear-gradient",
    reason: "DESIGN.md hero field: a bottom fade mask on .hero-field. A mask is not a gradient background.",
  },
];

interface Hit {
  file: string;
  line: number;
  text: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (SKIPPED_DIRS.some((skip) => path === skip || path.startsWith(skip + sep))) continue;
    if (statSync(path).isDirectory()) walk(path, out);
    else if (EXTENSIONS.test(name)) out.push(path);
  }
  return out;
}

/** Replace a comment with the same number of newlines so line numbers hold. */
function blank(match: string): string {
  return match.replace(/[^\n]/g, " ");
}

function stripComments(source: string, file: string): string {
  let text = source.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (file.endsWith(".astro") || file.endsWith(".mdx")) text = text.replace(/<!--[\s\S]*?-->/g, blank);
  if (/\.(ts|tsx|astro)$/.test(file)) text = text.replace(/(?<![:"'`\w\\])\/\/[^\n]*/g, blank);
  return text;
}

interface Source {
  file: string;
  raw: string;
  code: string;
}

const SOURCES: Source[] = walk(ROOT).map((path) => {
  const file = relative(".", path).split(sep).join("/");
  const raw = readFileSync(path, "utf8");
  return { file, raw, code: stripComments(raw, file) };
});

function isAllowed(rule: RuleId, file: string, line: string): boolean {
  return ALLOWED.some((a) => a.rule === rule && a.file === file && line.includes(a.snippet));
}

/** Run a per-line check on every scanned file. `check` returns the bad text or null. */
function scan(rule: RuleId, check: (line: string, file: string) => string | null, raw = false): Hit[] {
  const hits: Hit[] = [];
  for (const { file, raw: rawText, code } of SOURCES) {
    (raw ? rawText : code).split("\n").forEach((line, index) => {
      const bad = check(line, file);
      if (bad !== null && !isAllowed(rule, file, line)) {
        hits.push({ file, line: index + 1, text: `${bad}   <- ${line.trim().slice(0, 100)}` });
      }
    });
  }
  return hits;
}

function format(hits: Hit[]): string {
  return hits.map((h) => `${h.file}:${h.line} ${h.text}`).join("\n");
}

function expectNone(hits: Hit[]): void {
  expect(format(hits)).toBe("");
}

/** First match of `pattern` in `line`, or null. */
function first(line: string, pattern: RegExp): string | null {
  const m = line.match(pattern);
  return m ? m[0] : null;
}

/** Bare shadow utilities, CSS drop-shadow() and text-shadow. */
const BARE_SHADOW = /(?<![\w-])(?:[a-z-]+:)*(?:drop-)?shadow(?=[\s"'`]|$)|drop-shadow\(|text-shadow\s*:/;
/** transition-all, and `all` in a CSS or inline-style transition value or list. */
const TRANSITION_ALL =
  /(?<![\w-])transition-all(?![\w-])|transition(?:-property)?\s*:\s*["'`]?(?:[^;"'`]*,\s*)?all\b|transitionProperty\s*:\s*["']all["']/;
/** A whileHover or whileTap prop: the object, then the tag end or the next attribute. */
const WHILE_PROP = /while(?:Hover|Tap)\s*=\s*\{([\s\S]{0,240}?)\}\s*(?:\/?>|[\w-]+=)/g;

describe("design rules (DESIGN.md)", () => {
  it("scans source files", () => {
    expect(SOURCES.length).toBeGreaterThan(100);
  });

  it("patterns match known-bad samples", () => {
    for (const bad of ['className="shadow p-2"', "filter: drop-shadow(0 1px 2px #000);", "text-shadow: 0 0 2px red;"]) {
      expect(bad, bad).toMatch(BARE_SHADOW);
    }
    expect('className="shadow-[var(--overlay-shadow)]"').not.toMatch(BARE_SHADOW);
    for (const bad of ['className="transition-all"', 'style={{ transition: "all 200ms" }}', "transition: opacity 1s, all 2s;"]) {
      expect(bad, bad).toMatch(TRANSITION_ALL);
    }
    expect("transition: opacity 200ms;").not.toMatch(TRANSITION_ALL);
    const inline = '<motion.a whileHover={{ scale: 1.05 }} className="x">';
    expect([...inline.matchAll(WHILE_PROP)].map((m) => m[1])).toEqual(["{ scale: 1.05 }"]);
  });

  it("Shadows: no shadow utility and no box-shadow except var(--overlay-shadow) (DESIGN.md: Flat operator panels, --overlay-shadow)", () => {
    const utility = /(?<![\w-])(?:[a-z-]+:)*(?:drop-)?shadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner|none|\[|\()[^\s"'`]*/;
    const hits = scan("shadow", (line) => {
      const bare = line.replace(/shadow-\[var\(--overlay-shadow\)\]/g, "");
      const util = first(bare, utility) ?? first(bare, BARE_SHADOW);
      if (util) return util;
      const decl = line.match(/box-?shadow["']?\s*[:=]\s*([^;}\n]+)/i);
      if (decl) {
        const value = decl[1]!.trim().replace(/^["'`]+|[,"'`]+$/g, "");
        if (!/^(none|var\(--overlay-shadow\))$/.test(value)) return decl[0];
      }
      return null;
    });
    expectNone(hits);
  });

  it("Radius: rounded-* and border-radius are 0 or 2px only (DESIGN.md: Base radius 2px, no pill buttons)", () => {
    const okTailwind = /^(?:\[2px\]|\[0\]|\[0px\]|none)$/;
    const okCss = /^(?:0|0px|2px|inherit|unset|initial|revert)$/;
    const hits = scan("radius", (line) => {
      for (const m of line.matchAll(/(?<![\w-])((?:[a-z0-9-]+:)*)rounded((?:-(?:t|r|b|l|s|e|tl|tr|bl|br|ss|se|es|ee))?)(?:-([^\s"'`}]+))?(?=[\s"'`}]|$)/g)) {
        const value = m[3];
        if (value === undefined || !okTailwind.test(value)) return m[0];
      }
      for (const m of line.matchAll(/border-(?:top-|bottom-)?(?:left-|right-)?radius\s*:\s*([^;}]+)/g)) {
        const parts = m[1]!.trim().replace(/!important$/, "").trim().split(/\s+/);
        if (!parts.every((p) => okCss.test(p))) return m[0];
      }
      for (const m of line.matchAll(/borderRadius\s*:\s*([^,}\n]+)/g)) {
        const value = m[1]!.trim().replace(/^["']|["']$/g, "");
        if (!/^(?:0|2|0px|2px)$/.test(value)) return m[0];
      }
      return null;
    });
    expectNone(hits);
  });

  it("Gradients: no gradient backgrounds or buttons (DESIGN.md: Don't, 'No gradient backgrounds or buttons')", () => {
    const hits = scan("gradient", (line) =>
      first(line, /(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(|(?<![\w-])bg-(?:gradient-|linear-|radial-|conic-)[^\s"'`]*/),
    );
    expectNone(hits);
  });

  it("Transitions: no transition-all, name the changing properties (DESIGN.md: Motion, rule A1/A3)", () => {
    const hits = scan("transition-all", (line) =>
      first(line, TRANSITION_ALL),
    );
    expectNone(hits);
  });

  it("Hover and tap: whileHover and whileTap never change geometry (DESIGN.md: rule A3)", () => {
    const geometry = /\b(?:scale|scaleX|scaleY|x|y|width|height|margin\w*|padding\w*|top|left|right|bottom|rotate|translate\w*)\s*:/;
    const hits: Hit[] = [];
    for (const { file, code } of SOURCES) {
      for (const m of code.matchAll(WHILE_PROP)) {
        if (geometry.test(m[1]!)) {
          const line = code.slice(0, m.index).split("\n").length;
          hits.push({ file, line, text: m[0].replace(/\s+/g, " ").slice(0, 100) });
        }
      }
    }
    expectNone(hits.filter((h) => !isAllowed("hover-geometry", h.file, h.text)));
  });

  it("Ambient loops: no animate-pulse, animate-bounce, animate-ping or pulse-scale (DESIGN.md: Don't, rule A1)", () => {
    const hits = scan("ambient-loop", (line) =>
      first(line, /(?<![\w-])(?:[a-z-]+:)*animate-(?:pulse|bounce|ping)(?![\w-])|pulse-scale/),
    );
    expectNone(hits);
  });

  it("Legacy tokens: --accent, --accent-N, --phosphor-glow, --titlebar*, --window-shadow*, --dot-dim, --signal-* stay deleted (DESIGN.md: Don't)", () => {
    const hits = scan("legacy-token", (line) =>
      first(line, /--(?:accent(?:-\d+)?|phosphor-glow|titlebar[\w-]*|window-shadow[\w-]*|dot-dim|signal-[\w-]+)(?![\w-])/),
    );
    expectNone(hits);
  });

  it("Fonts: font-family uses Geist, Geist Mono, Geist Pixel, Piazzolla or the --font-* stacks (DESIGN.md: Typography)", () => {
    const okFamily = new RegExp(
      "^(?:var\\(--font-[\\w-]+\\)|inherit|unset|initial|" +
        "(?:Geist|Geist Mono|Geist Pixel|Piazzolla|Geist Variable|Geist Mono Variable|Piazzolla Variable|" +
        "Geist Fallback|Geist Mono Fallback|Piazzolla Fallback)|" +
        // Fallbacks listed in the --font-serif and --font-mono stacks in DESIGN.md.
        "Georgia|Iowan Old Style|Charter|Times New Roman|serif|sans-serif|monospace|ui-monospace|ui-sans-serif|system-ui|" +
        // System fallbacks in the --font-sans and --font-mono stacks in src/styles/tailwind.css.
        "-apple-system|Segoe UI|Fira Code|Cascadia Code|SF Mono)$",
    );
    const hits = scan("font-family", (line) => {
      for (const m of line.matchAll(/font-family\s*:\s*([^;}]+)|fontFamily\s*:\s*([^,}\n]+)|--font-(?!size|weight)[\w-]+\s*:\s*([^;}]+)/g)) {
        const families = (m[1] ?? m[2] ?? m[3]!).split(",").map((f) => f.trim().replace(/^["']|["']$/g, ""));
        if (!families.every((f) => okFamily.test(f))) return m[0];
      }
      return first(line, /(?<![\w-])(?:[a-z-]+:)*font-\[[^\]]+\]/);
    });
    expectNone(hits);
  });

  it("Emoji: no emoji characters in UI source (AGENTS.md: no emoji in code or docs)", () => {
    const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}\u{231A}\u{231B}\u{23E9}-\u{23F3}]/u;
    const hits = scan("emoji", (line) => first(line, emoji), true);
    expectNone(hits);
  });

  it("Allowlist entries each match a real line (no stale exceptions)", () => {
    for (const a of ALLOWED) {
      const source = SOURCES.find((s) => s.file === a.file);
      expect(source, `${a.file} is not scanned`).toBeDefined();
      expect(source!.code.includes(a.snippet), `${a.file} no longer has: ${a.snippet}`).toBe(true);
    }
  });

  // Ratchet for the motion-token rule (DESIGN.md: "Durations and easings come from the tokens").
  // Scope: every scanned file, including src/admin. Lower this number when you migrate a
  // duration-NNN utility to a motion token. Never raise it.
  it("Motion tokens: raw duration-NNN utilities do not grow (DESIGN.md motion-token rule)", () => {
    const MAX_RAW_DURATIONS = 93;
    const count = SOURCES.reduce((n, s) => n + (s.code.match(/(?<![\w-])duration-\d+(?![\w-])/g)?.length ?? 0), 0);
    expect(count).toBeLessThanOrEqual(MAX_RAW_DURATIONS);
  });
});
