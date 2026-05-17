import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type OutputFormat = "json" | "markdown";

interface Finding {
  path: string;
  line: number;
  severity: string;
  kind: string;
  message: string;
  suggestion: string;
}

interface IgnoredFinding extends Finding {
  reason: IgnoreReason;
}

type IgnoreReason = "repo-noise" | "test-noise" | "generator-heuristic" | "frontend-heuristic";

interface Options {
  format: OutputFormat;
  limit: number;
  maxFindings: number;
  root: string;
}

const scannerRelativePath = path.join(
  "skills",
  "complexity-optimizer",
  "scripts",
  "analyze_complexity.py",
);

const scannerExcludes = ["node_modules", "dist"];
const repoNoisePrefixes = [".agents/", ".claude/", ".astro/", "node_modules/", "dist/", "src/data/"];
const repoNoiseSegments = ["/node_modules/", "/dist/", "/src/data/"];
const testNoisePrefixes = ["e2e/", "src/__tests__/"];
const testNoiseSegments = ["/__tests__/"];
const lowRiskGeneratorFiles = new Set([
  "scripts/generate-blog-data.ts",
  "scripts/generate-seed.ts",
  "scripts/generate-experience-data.ts",
  "scripts/generate-projects-data.ts",
]);
const lowRiskGeneratorKinds = new Set([
  "nested-or-callback-loop",
  "nested-loop",
  "sort-in-loop",
]);

function parseArgs(argv: string[]): Options {
  let format: OutputFormat = "markdown";
  let limit = 25;
  let maxFindings = 80;
  let root = process.cwd();

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];

    if (arg === "--json") {
      format = "json";
      continue;
    }

    if (arg === "--markdown") {
      format = "markdown";
      continue;
    }

    if (arg === "--format") {
      const value = argv[index + 1];
      if (value !== "json" && value !== "markdown") {
        throw new Error("--format must be json or markdown");
      }
      format = value;
      index++;
      continue;
    }

    if (arg?.startsWith("--format=")) {
      const value = arg.slice("--format=".length);
      if (value !== "json" && value !== "markdown") {
        throw new Error("--format must be json or markdown");
      }
      format = value;
      continue;
    }

    if (arg === "--max-findings") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 1) {
        throw new Error("--max-findings must be a positive integer");
      }
      maxFindings = value;
      index++;
      continue;
    }

    if (arg === "--limit") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 0) {
        throw new Error("--limit must be a non-negative integer");
      }
      limit = value;
      index++;
      continue;
    }

    if (arg?.startsWith("--limit=")) {
      const value = Number(arg.slice("--limit=".length));
      if (!Number.isInteger(value) || value < 0) {
        throw new Error("--limit must be a non-negative integer");
      }
      limit = value;
      continue;
    }

    if (arg?.startsWith("--max-findings=")) {
      const value = Number(arg.slice("--max-findings=".length));
      if (!Number.isInteger(value) || value < 1) {
        throw new Error("--max-findings must be a positive integer");
      }
      maxFindings = value;
      continue;
    }

    if (arg === "--root") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--root requires a path");
      }
      root = path.resolve(value);
      index++;
      continue;
    }

    if (arg?.startsWith("--root=")) {
      root = path.resolve(arg.slice("--root=".length));
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg?.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    root = path.resolve(arg);
  }

  return { format, limit, maxFindings, root };
}

function printHelp(): void {
  console.log(`Usage: npm run scan:complexity -- [--format markdown|json] [--limit 25] [--max-findings 500] [--root .]

Runs the external complexity-optimizer scanner when available, then filters repo-local noise and known low-risk generator heuristic hits.`);
}

function findScanner(): string | null {
  const candidates = [
    process.env.COMPLEXITY_SCANNER,
    process.env.CODEX_HOME ? path.join(process.env.CODEX_HOME, scannerRelativePath) : undefined,
    path.join(process.env.HOME ?? os.homedir(), ".codex", scannerRelativePath),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function isRepoNoise(findingPath: string): boolean {
  if (findingPath === "scripts/scan-complexity.ts") {
    return true;
  }

  return (
    repoNoisePrefixes.some((prefix) => findingPath === prefix.slice(0, -1) || findingPath.startsWith(prefix)) ||
    repoNoiseSegments.some((segment) => findingPath.includes(segment))
  );
}

function isTestNoise(findingPath: string): boolean {
  return (
    testNoisePrefixes.some((prefix) => findingPath.startsWith(prefix)) ||
    testNoiseSegments.some((segment) => findingPath.includes(segment)) ||
    /\.test\.[tj]sx?$/.test(findingPath) ||
    /\.spec\.[tj]sx?$/.test(findingPath)
  );
}

function isLowRiskGeneratorHeuristic(finding: Finding): boolean {
  return (
    (lowRiskGeneratorFiles.has(finding.path) || /^scripts\/generate-[\w-]+\.ts$/.test(finding.path)) &&
    lowRiskGeneratorKinds.has(finding.kind)
  );
}

function isLowRiskFrontendHeuristic(finding: Finding): boolean {
  return (
    /\.(?:astro|tsx|jsx)$/.test(finding.path) &&
    [
      "nested-or-callback-loop",
      "sort-in-loop",
      "membership-in-loop",
      "io-or-query-in-loop",
      "render-derived-work",
    ].includes(finding.kind)
  );
}

function ignoreReason(finding: Finding): IgnoreReason | null {
  if (isRepoNoise(finding.path)) {
    return "repo-noise";
  }

  if (isTestNoise(finding.path)) {
    return "test-noise";
  }

  if (isLowRiskGeneratorHeuristic(finding)) {
    return "generator-heuristic";
  }

  if (isLowRiskFrontendHeuristic(finding)) {
    return "frontend-heuristic";
  }

  return null;
}

function runScanner(scannerPath: string, options: Options): Finding[] {
  const args = [
    scannerPath,
    options.root,
    "--format",
    "json",
    "--max-findings",
    String(options.maxFindings),
    ...scannerExcludes.flatMap((exclude) => ["--exclude", exclude]),
  ];
  const result = spawnSync("python3", args, { encoding: "utf8" });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `Scanner exited with status ${result.status ?? "unknown"}`);
  }

  const parsed: unknown = JSON.parse(result.stdout);
  if (!Array.isArray(parsed)) {
    throw new Error("Scanner JSON output was not an array");
  }

  return parsed.map(toFinding);
}

function toFinding(value: unknown): Finding {
  if (!value || typeof value !== "object") {
    throw new Error("Scanner returned a non-object finding");
  }

  const candidate = value as Record<string, unknown>;
  const finding: Finding = {
    path: readString(candidate, "path"),
    line: readNumber(candidate, "line"),
    severity: readString(candidate, "severity"),
    kind: readString(candidate, "kind"),
    message: readString(candidate, "message"),
    suggestion: readString(candidate, "suggestion"),
  };

  return finding;
}

function readString(candidate: Record<string, unknown>, key: keyof Finding): string {
  const value = candidate[key];
  if (typeof value !== "string") {
    throw new Error(`Scanner finding is missing string field: ${key}`);
  }
  return value;
}

function readNumber(candidate: Record<string, unknown>, key: keyof Finding): number {
  const value = candidate[key];
  if (typeof value !== "number") {
    throw new Error(`Scanner finding is missing number field: ${key}`);
  }
  return value;
}

function summarize(findings: Finding[]): { actionable: Finding[]; ignored: IgnoredFinding[] } {
  const actionable: Finding[] = [];
  const ignored: IgnoredFinding[] = [];

  for (const finding of findings) {
    const reason = ignoreReason(finding);
    if (reason) {
      ignored.push({ ...finding, reason });
    } else {
      actionable.push(finding);
    }
  }

  return { actionable, ignored };
}

function countByReason(ignored: IgnoredFinding[]): Record<IgnoreReason, number> {
  return {
    "repo-noise": ignored.filter((finding) => finding.reason === "repo-noise").length,
    "test-noise": ignored.filter((finding) => finding.reason === "test-noise").length,
    "generator-heuristic": ignored.filter((finding) => finding.reason === "generator-heuristic").length,
    "frontend-heuristic": ignored.filter((finding) => finding.reason === "frontend-heuristic").length,
  };
}

function countBySeverity(findings: Finding[]): Record<string, number> {
  return findings.reduce<Record<string, number>>((counts, finding) => {
    counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
    return counts;
  }, {});
}

function rankFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((left, right) => {
    return (
      severityRank(left.severity) - severityRank(right.severity) ||
      surfaceRank(left.path) - surfaceRank(right.path) ||
      left.path.localeCompare(right.path) ||
      left.line - right.line
    );
  });
}

function severityRank(severity: string): number {
  if (severity === "high") {
    return 0;
  }

  if (severity === "medium") {
    return 1;
  }

  return 2;
}

function surfaceRank(findingPath: string): number {
  if (findingPath.includes("__tests__/") || /\.test\.[tj]sx?$/.test(findingPath)) {
    return 3;
  }

  if (findingPath.startsWith("src/")) {
    return 0;
  }

  if (findingPath.startsWith("scripts/")) {
    return 2;
  }

  return 1;
}

function renderMarkdown(options: Options, raw: Finding[], actionable: Finding[], ignored: IgnoredFinding[]): string {
  const ignoredCounts = countByReason(ignored);
  const visibleFindings = rankFindings(actionable).slice(0, options.limit);
  const omittedFindings = Math.max(0, actionable.length - visibleFindings.length);
  const lines = [
    "# Complexity Scanner Summary",
    "",
    `- Root: \`${path.relative(process.cwd(), options.root) || "."}\``,
    `- Raw findings after scanner excludes: ${raw.length}`,
    `- Ignored repo noise: ${ignoredCounts["repo-noise"]}`,
    `- Ignored low-risk generator heuristics: ${ignoredCounts["generator-heuristic"]}`,
    `- Actionable app-owned findings: ${actionable.length}`,
    "",
  ];

  if (actionable.length === 0) {
    lines.push("No actionable app-owned complexity findings remain after filtering.", "");
    return lines.join("\n");
  }

  if (visibleFindings.length === 0) {
    lines.push(`${actionable.length} actionable findings hidden by \`--limit 0\`.`, "");
    return lines.join("\n");
  }

  lines.push(`## Top ${visibleFindings.length} Findings`, "");
  for (const finding of visibleFindings) {
    lines.push(
      `- ${finding.severity.toUpperCase()} ${finding.kind} at \`${finding.path}:${finding.line}\`: ${finding.message} ${finding.suggestion}`,
    );
  }
  if (omittedFindings > 0) {
    lines.push("", `${omittedFindings} additional actionable findings omitted. Re-run with \`-- --limit ${actionable.length}\` to print all.`);
  }
  lines.push("");

  return lines.join("\n");
}

function renderJson(options: Options, raw: Finding[], actionable: Finding[], ignored: IgnoredFinding[]): string {
  const visibleFindings = rankFindings(actionable).slice(0, options.limit);
  return `${JSON.stringify(
    {
      rawFindings: raw.length,
      actionableFindings: actionable.length,
      ignoredFindings: ignored.length,
      ignoredByReason: countByReason(ignored),
      actionableBySeverity: countBySeverity(actionable),
      omittedActionableFindings: Math.max(0, actionable.length - visibleFindings.length),
      findings: visibleFindings,
    },
    null,
    2,
  )}\n`;
}

function main(): number {
  try {
    const options = parseArgs(process.argv.slice(2));
    const scannerPath = findScanner();

    if (!scannerPath) {
      const message = "External complexity scanner not found. Set COMPLEXITY_SCANNER, CODEX_HOME, or HOME so ~/.codex/skills/complexity-optimizer/scripts/analyze_complexity.py can be located.";
      if (options.format === "json") {
        console.log(JSON.stringify({ scannerAvailable: false, error: message }, null, 2));
      } else {
        console.error(message);
      }
      return 2;
    }

    const raw = runScanner(scannerPath, options);
    const { actionable, ignored } = summarize(raw);
    const output = options.format === "json" ? renderJson(options, raw, actionable, ignored) : renderMarkdown(options, raw, actionable, ignored);
    process.stdout.write(output);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`scan:complexity failed: ${message}`);
    return 1;
  }
}

process.exitCode = main();
