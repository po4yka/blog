// Generates src/data/fieldSeed.ts: git commit counts per day for the last 13 weeks (91 numbers,
// oldest first) plus the build hash. The hero dither field and its poster both read this file,
// so they cannot disagree. Refresh rule identical to buildMeta.ts: only in CI or with
// BLOG_REFRESH_BUILD_META=1; otherwise the committed file is kept, and the caption's hash shows
// how old the data is.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const FIELD_SEED_FILE = path.resolve("src/data/fieldSeed.ts");
export const FIELD_SEED_DAYS = 91;

export interface FieldSeed {
  hash: string;
  counts: number[];
}

function isEnabled(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

function shouldRefresh(): boolean {
  return isEnabled(process.env.CI) || isEnabled(process.env.CF_PAGES) || process.env.BLOG_REFRESH_BUILD_META === "1";
}

/** Day counts for the `days` days ending at `today` (YYYY-MM-DD), oldest first, from `git log` dates (YYYY-MM-DD, one per commit). */
export function countsPerDay(commitDates: readonly string[], today: string, days = FIELD_SEED_DAYS): number[] {
  const end = Date.parse(`${today}T00:00:00Z`);
  const index = new Map<string, number>();
  for (let i = 0; i < days; i++) index.set(new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10), i);
  const counts = new Array<number>(days).fill(0);
  for (const date of commitDates) {
    const i = index.get(date);
    if (i !== undefined) counts[i]!++;
  }
  // No commits in the window means no data: the field shows its flat fallback and the caption says so.
  return counts.some((n) => n > 0) ? counts : [];
}

function readGitSeed(): FieldSeed {
  const hash = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf-8" }).trim();
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.parse(`${today}T00:00:00Z`) - (FIELD_SEED_DAYS - 1) * 86_400_000).toISOString().slice(0, 10);
  const log = execFileSync("git", ["log", "HEAD", "--format=%cs", `--since=${since}`], { encoding: "utf-8", maxBuffer: 16 * 1024 * 1024 });
  return { hash, counts: countsPerDay(log.split("\n").filter(Boolean), today) };
}

/** Read `hash` and `counts` back out of a generated file. Throws when the shape is wrong. */
export function parseFieldSeed(source: string): FieldSeed {
  const hash = source.match(/\bhash:\s*"([0-9a-f]{4,40})"/)?.[1];
  const list = source.match(/\bcounts:\s*\[([^\]]*)\]/)?.[1];
  if (!hash || list === undefined) throw new Error("fieldSeed.ts: missing hash or counts");
  const counts = list.split(",").map((s) => s.trim()).filter(Boolean).map(Number);
  if (counts.some((n) => !Number.isInteger(n) || n < 0)) throw new Error("fieldSeed.ts: counts must be non-negative integers");
  if (counts.length !== 0 && counts.length !== FIELD_SEED_DAYS) {
    throw new Error(`fieldSeed.ts: expected ${FIELD_SEED_DAYS} counts or none, got ${counts.length}`);
  }
  return { hash, counts };
}

export function renderFieldSeed({ hash, counts }: FieldSeed): string {
  return `// Auto-generated hero field seed: git commits per day, last 13 weeks, oldest first. Do not edit manually.
// Run "npm run generate:all" to regenerate. Refreshes only in CI or with BLOG_REFRESH_BUILD_META=1.

export const fieldSeed: { readonly hash: string; readonly counts: readonly number[] } = {
  hash: "${hash}",
  counts: [${counts.join(", ")}],
};
`;
}

export function generateFieldSeedSource(): string {
  if (!shouldRefresh() && fs.existsSync(FIELD_SEED_FILE)) {
    const source = fs.readFileSync(FIELD_SEED_FILE, "utf-8");
    parseFieldSeed(source);
    return source;
  }
  return renderFieldSeed(readGitSeed());
}
