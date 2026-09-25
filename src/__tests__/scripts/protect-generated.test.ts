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

  it("blocks Codex apply_patch touching a generated file", () => {
    const patch = (body: string) =>
      JSON.stringify({ tool_name: "apply_patch", cwd: root, tool_input: { command: body } });
    const update = "*** Begin Patch\n*** Update File: src/content/projects.json\n@@\n-a\n+b\n*** Update File: src/data/projectsData.ts\n@@\n-a\n+b\n*** End Patch\n";
    const rename = "*** Begin Patch\n*** Update File: src/tmp.ts\n*** Move to: db/seed.sql\n*** End Patch\n";
    const clean = "*** Begin Patch\n*** Add File: src/content/blog/en/new.mdx\n+hi\n*** End Patch\n";
    expect(runHook(patch(update)).status).toBe(2);
    expect(runHook(patch(rename)).status).toBe(2);
    expect(runHook(patch(clean)).status).toBe(0);
  });

  it("allows canonical sources and unparseable input", () => {
    expect(runHook(editOf("src/content/projects.json")).status).toBe(0);
    expect(runHook("not json").status).toBe(0);
  });
});
