// Generates build-time metadata (git hash, deploy timestamp, content counts, Astro version).
// Called by generate-all-data.ts as part of the build pipeline.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

interface BuildMetaIdentity {
  commitHash?: string;
  deployDate?: string;
}

function isEnabled(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

function shouldRefreshBuildIdentity(): boolean {
  return isEnabled(process.env.CI) || isEnabled(process.env.CF_PAGES) || process.env.BLOG_REFRESH_BUILD_META === "1";
}

function readExistingBuildIdentity(): BuildMetaIdentity {
  const buildMetaFile = path.resolve("src/data/buildMeta.ts");

  if (shouldRefreshBuildIdentity() || !fs.existsSync(buildMetaFile)) {
    return {};
  }

  const source = fs.readFileSync(buildMetaFile, "utf-8");
  const commitHash = source.match(/\bcommitHash:\s*"([^"]+)"/)?.[1];
  const deployDate = source.match(/\bdeployDate:\s*"([^"]+)"/)?.[1];

  return {
    commitHash,
    deployDate,
  };
}

function getCurrentCommitHash(): string {
  return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
}

export function generateBuildMetaSource(): string {
  const existingIdentity = readExistingBuildIdentity();
  const commitHash = existingIdentity.commitHash ?? getCurrentCommitHash();
  const deployDate = existingIdentity.deployDate ?? new Date().toISOString();

  const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf-8")) as {
    dependencies?: Record<string, string>;
  };
  const astroVersion = (pkg.dependencies?.astro ?? "unknown").replace(/^\^/, "");

  // Count content
  const blogDir = path.resolve("src/content/blog/en");
  const postCount = fs.existsSync(blogDir)
    ? fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx")).length
    : 0;

  const projectsFile = path.resolve("src/content/projects.json");
  const projectCount = fs.existsSync(projectsFile)
    ? (JSON.parse(fs.readFileSync(projectsFile, "utf-8")) as unknown[]).length
    : 0;

  const experienceFile = path.resolve("src/content/experience.json");
  let experienceCount = 0;
  if (fs.existsSync(experienceFile)) {
    const raw = JSON.parse(fs.readFileSync(experienceFile, "utf-8")) as { roles?: unknown[] } | unknown[];
    experienceCount = Array.isArray(raw) ? raw.length : (raw.roles?.length ?? 0);
  }

  return `// Auto-generated build metadata. Do not edit manually.
// Run "npm run generate:all" to regenerate.

export const buildMeta = {
  commitHash: "${commitHash}",
  deployDate: "${deployDate}",
  astroVersion: "${astroVersion}",
  postCount: ${postCount},
  projectCount: ${projectCount},
  roleCount: ${experienceCount},
} as const;
`;
}
