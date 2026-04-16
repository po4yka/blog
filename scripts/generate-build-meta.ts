// Generates build-time metadata (git hash, deploy timestamp, content counts, Astro version).
// Called by generate-all-data.ts as part of the build pipeline.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function generateBuildMetaSource(): string {
  const commitHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  const deployDate = new Date().toISOString();

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
  const experienceCount = fs.existsSync(experienceFile)
    ? (JSON.parse(fs.readFileSync(experienceFile, "utf-8")) as unknown[]).length
    : 0;

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
