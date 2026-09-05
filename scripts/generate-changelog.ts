// Generates src/data/changelog.ts from the git history: one release per day
// that shipped a user-visible change, in the shape of mobile release notes
// (version = date, build = commit ordinal). Called by generate-all-data.ts.
//
// Refresh policy mirrors generate-build-meta.ts: the committed file is kept
// as-is on local builds so every commit does not dirty it, and it is
// regenerated from the full history in CI (checkout must use fetch-depth 0).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { ChangelogEntry, ChangelogRelease } from "../src/types/index.js";

const OUTPUT_FILE = path.resolve("src/data/changelog.ts");
const MAX_RELEASES = 40;
const USER_VISIBLE = new Set(["feat", "fix", "perf"]);
const SEP = "\x1f";

const CONVENTIONAL = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?:\s+(?<subject>.+)$/;

function isEnabled(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

function shouldRefresh(): boolean {
  return isEnabled(process.env.CI) || isEnabled(process.env.CF_PAGES) || process.env.BLOG_REFRESH_BUILD_META === "1";
}

function readLog(): Array<{ hash: string; date: string; subject: string }> {
  const raw = execFileSync("git", ["log", `--format=%h${SEP}%ad${SEP}%s`, "--date=short"], {
    encoding: "utf-8",
    maxBuffer: 16 * 1024 * 1024,
  });
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash = "", date = "", subject = ""] = line.split(SEP);
      return { hash, date, subject };
    });
}

export function buildReleases(log: Array<{ hash: string; date: string; subject: string }>): ChangelogRelease[] {
  const total = log.length;
  const byDate = new Map<string, ChangelogRelease>();

  log.forEach((commit, index) => {
    const m = CONVENTIONAL.exec(commit.subject);
    const type = m?.groups?.type;
    if (!m || !type || !USER_VISIBLE.has(type)) return;
    // Dependabot-style bumps arrive as chore/build and are already excluded;
    // drop the rare version bump filed under fix(deps) too: not release notes.
    if (m.groups?.scope === "deps") return;

    let release = byDate.get(commit.date);
    if (!release) {
      release = {
        version: commit.date.replace(/-/g, "."),
        // log is newest-first, so the first commit seen for a day is its last.
        build: total - index,
        date: commit.date,
        entries: [],
      };
      byDate.set(commit.date, release);
    }
    release.entries.push({
      type: type as ChangelogEntry["type"],
      scope: m.groups?.scope ?? null,
      subject: m.groups?.subject ?? commit.subject,
      hash: commit.hash,
      breaking: m.groups?.bang === "!",
    });
  });

  return Array.from(byDate.values()).slice(0, MAX_RELEASES);
}

function serialize(releases: ChangelogRelease[]): string {
  return `// Auto-generated from git history. Do not edit manually.
// Run "BLOG_REFRESH_BUILD_META=1 npm run generate:all" to refresh locally.
import type { ChangelogRelease } from "@/types";

export type { ChangelogRelease };

export const changelog: ChangelogRelease[] = ${JSON.stringify(releases, null, 2)};
`;
}

export function generateChangelogSource(): string {
  if (!shouldRefresh() && fs.existsSync(OUTPUT_FILE)) {
    return fs.readFileSync(OUTPUT_FILE, "utf-8");
  }
  let log: Array<{ hash: string; date: string; subject: string }>;
  try {
    log = readLog();
  } catch {
    log = [];
  }
  // A shallow clone yields one commit: not a history. Keep whatever was
  // committed rather than shipping an empty page.
  if (log.length < 2 && fs.existsSync(OUTPUT_FILE)) {
    return fs.readFileSync(OUTPUT_FILE, "utf-8");
  }
  return serialize(buildReleases(log));
}

// Run as script
if (import.meta.url === `file://${process.argv[1]}`) {
  fs.writeFileSync(OUTPUT_FILE, generateChangelogSource(), "utf-8");
  console.log(`Generated ${OUTPUT_FILE}`);
}
