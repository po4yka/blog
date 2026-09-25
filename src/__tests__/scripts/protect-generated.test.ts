import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const hook = path.join(root, "scripts/hooks/protect-generated.mjs");

function runHook(input: string) {
  return spawnSync("node", [hook], { input, cwd: root });
}

const editOf = (filePath: string) =>
  JSON.stringify({ tool_name: "Edit", cwd: root, tool_input: { file_path: filePath } });

describe("protect-generated hook", () => {
  it("blocks absolute and relative paths to generated files", () => {
    expect(runHook(editOf(path.join(root, "src/data/blogData.ts"))).status).toBe(2);
    expect(runHook(editOf("src/data/../data/blogMeta.ts")).status).toBe(2);
    expect(runHook(editOf("db/seed.sql")).status).toBe(2);
    expect(runHook(editOf("src/data/BlogData.ts")).status).toBe(2);
    expect(runHook(editOf(".claude/worktrees/x/src/data/changelog.ts")).status).toBe(2);
  });

  it("allows canonical sources and unparseable input", () => {
    expect(runHook(editOf("src/content/projects.json")).status).toBe(0);
    expect(runHook("not json").status).toBe(0);
  });
});
