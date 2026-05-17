import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateBuildMetaSource } from "../../../scripts/generate-build-meta";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(() => "fresh123\n"),
}));

const execSyncMock = vi.mocked(execSync);
const originalCwd = process.cwd();
const envKeys = ["CI", "CF_PAGES", "BLOG_REFRESH_BUILD_META"] as const;
const originalEnv = new Map(envKeys.map((key) => [key, process.env[key]]));
let tempDirs: string[] = [];

const existingBuildMeta = `// Auto-generated build metadata. Do not edit manually.
// Run "npm run generate:all" to regenerate.

export const buildMeta = {
  commitHash: "localabc",
  deployDate: "2026-01-02T03:04:05.006Z",
  astroVersion: "old",
  postCount: 0,
  projectCount: 0,
  roleCount: 0,
} as const;
`;

function restoreEnv(): void {
  for (const key of envKeys) {
    const value = originalEnv.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function clearBuildMetaRefreshEnv(): void {
  for (const key of envKeys) {
    delete process.env[key];
  }
}

function createProjectFixture(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-build-meta-"));
  tempDirs.push(dir);

  fs.mkdirSync(path.join(dir, "src/content/blog/en"), { recursive: true });
  fs.mkdirSync(path.join(dir, "src/data"), { recursive: true });
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { astro: "^6.1.7" } }));
  fs.writeFileSync(path.join(dir, "src/content/blog/en/one.mdx"), "");
  fs.writeFileSync(path.join(dir, "src/content/blog/en/two.mdx"), "");
  fs.writeFileSync(path.join(dir, "src/content/projects.json"), JSON.stringify([{ id: "one" }, { id: "two" }]));
  fs.writeFileSync(path.join(dir, "src/content/experience.json"), JSON.stringify({ roles: [{}, {}, {}] }));
  fs.writeFileSync(path.join(dir, "src/data/buildMeta.ts"), existingBuildMeta);

  return dir;
}

beforeEach(() => {
  restoreEnv();
  execSyncMock.mockReset();
  execSyncMock.mockReturnValue("fresh123\n");
});

afterEach(() => {
  process.chdir(originalCwd);
  restoreEnv();
  vi.useRealTimers();

  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

describe("generateBuildMetaSource", () => {
  it("reuses existing commit hash and deploy date during local generation", () => {
    clearBuildMetaRefreshEnv();
    process.chdir(createProjectFixture());

    const output = generateBuildMetaSource();

    expect(execSyncMock).not.toHaveBeenCalled();
    expect(output).toContain('commitHash: "localabc"');
    expect(output).toContain('deployDate: "2026-01-02T03:04:05.006Z"');
    expect(output).toContain('astroVersion: "6.1.7"');
    expect(output).toContain("postCount: 2");
    expect(output).toContain("projectCount: 2");
    expect(output).toContain("roleCount: 3");
  });

  it.each([
    ["CI", "true"],
    ["CF_PAGES", "true"],
    ["BLOG_REFRESH_BUILD_META", "1"],
  ] as const)("refreshes commit hash and deploy date when %s=%s", (key, value) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-02T03:04:05.006Z"));
    process.env[key] = value;
    process.chdir(createProjectFixture());

    const output = generateBuildMetaSource();

    expect(execSyncMock).toHaveBeenCalledWith("git rev-parse --short HEAD", { encoding: "utf-8" });
    expect(output).toContain('commitHash: "fresh123"');
    expect(output).toContain('deployDate: "2030-01-02T03:04:05.006Z"');
  });
});
