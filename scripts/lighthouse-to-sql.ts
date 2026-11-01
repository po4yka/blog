// Turns the CI Lighthouse reports into SQL for the D1 lighthouse_runs table (admin Telemetry).
// The deploy job runs: npx tsx scripts/lighthouse-to-sql.ts lighthouse-reports <commit> > lighthouse.sql
// Reads <dir>/{desktop,mobile}/manifest.json written by `lhci autorun` with the filesystem target.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FORM_FACTORS = ["desktop", "mobile"] as const;
const MIGRATION = path.resolve("db/migrations/008_telemetry_history.sql");
const RETENTION_DAYS = 180;

interface ManifestEntry {
  url: string;
  isRepresentativeRun: boolean;
  jsonPath: string;
  summary: Record<string, number | null | undefined>;
}

interface Lhr {
  audits: Record<string, { numericValue?: number } | undefined>;
}

const sqlString = (s: string) => `'${s.replaceAll("'", "''")}'`;
const sqlNumber = (n: number | null | undefined) => (typeof n === "number" && Number.isFinite(n) ? String(n) : "NULL");

export function lighthouseSql(reportsDir: string, commit: string, measuredAt: string, migrationSql: string): string {
  if (!/^[0-9a-f]{7,40}$/.test(commit)) throw new Error(`Not a commit SHA: ${commit}`);
  const inserts: string[] = [];
  for (const formFactor of FORM_FACTORS) {
    const dir = path.join(reportsDir, formFactor);
    const manifestPath = path.join(dir, "manifest.json");
    // A form factor whose run was cancelled has no manifest; store what exists and say so in the CI log.
    if (!fs.existsSync(manifestPath)) {
      console.error(`::warning::No ${formFactor} Lighthouse results for this deploy`);
      continue;
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ManifestEntry[];
    for (const entry of manifest.filter((e) => e.isRepresentativeRun)) {
      // jsonPath is absolute on the runner that wrote it; the artifact keeps the file name.
      const lhr = JSON.parse(fs.readFileSync(path.join(dir, path.basename(entry.jsonPath)), "utf8")) as Lhr;
      const audit = (id: string) => lhr.audits[id]?.numericValue;
      const values = [
        sqlString(commit),
        sqlString(measuredAt),
        sqlString(formFactor),
        sqlString(new URL(entry.url).pathname),
        sqlNumber(entry.summary.performance),
        sqlNumber(entry.summary.accessibility),
        sqlNumber(entry.summary["best-practices"]),
        sqlNumber(audit("largest-contentful-paint")),
        sqlNumber(audit("cumulative-layout-shift")),
        sqlNumber(audit("total-blocking-time")),
      ];
      inserts.push(
        `INSERT INTO lighthouse_runs (commit_sha, measured_at, form_factor, path, performance, accessibility, best_practices, lcp_ms, cls, tbt_ms) VALUES (${values.join(", ")});`,
      );
    }
  }
  if (inserts.length === 0) throw new Error(`No Lighthouse manifests under ${reportsDir}`);
  return [
    migrationSql.trim(),
    // A re-run deploy of the same commit replaces its rows instead of failing on the primary key.
    `DELETE FROM lighthouse_runs WHERE commit_sha = ${sqlString(commit)};`,
    ...inserts,
    `DELETE FROM lighthouse_runs WHERE measured_at < datetime('now', '-${RETENTION_DAYS} days');`,
    "",
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [reportsDir, commit] = process.argv.slice(2);
  if (!reportsDir || !commit) {
    console.error("Usage: tsx scripts/lighthouse-to-sql.ts <reports-dir> <commit-sha>");
    process.exit(1);
  }
  // SQLite datetime format, so the retention DELETE compares like with like.
  const measuredAt = new Date().toISOString().replace("T", " ").slice(0, 19);
  process.stdout.write(lighthouseSql(reportsDir, commit, measuredAt, fs.readFileSync(MIGRATION, "utf8")));
}
