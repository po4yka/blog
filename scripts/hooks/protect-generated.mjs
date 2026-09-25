#!/usr/bin/env node
// PreToolUse hook for Claude Code (Edit/Write: tool_input.file_path) and Codex
// (apply_patch: tool_input.command holds the patch): block direct edits to
// generated data files.
// These files are rebuilt by `npm run generate:all` (and by `npm run build`),
// so a hand edit is silently lost at deploy. Exit 2 blocks the tool call and
// returns stderr to the agent.
import { resolve } from "node:path";

// Suffix match (case-insensitive: APFS is) so worktrees and odd casing are caught too.
const GENERATED =
  /(^|\/)(src\/data\/(blogData|blogMeta|projectsData|experienceData|changelog|buildMeta)\.ts|db\/seed\.sql)$/i;

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let input;
try {
  input = JSON.parse(raw);
} catch {
  process.exit(0); // not our input shape; never block on a parse failure
}
const toolInput = input?.tool_input ?? {};
const paths = [];
if (typeof toolInput.file_path === "string") paths.push(toolInput.file_path);
if (typeof toolInput.command === "string") {
  // Codex apply_patch headers: "*** Add File: p", "*** Update File: p",
  // "*** Delete File: p", and "*** Move to: p" for renames.
  for (const match of toolInput.command.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$|^\*\*\* Move to: (.+)$/gm)) {
    paths.push((match[1] ?? match[2]).trim());
  }
}

const cwd = input.cwd ?? process.cwd();
const blocked = paths.filter((p) => GENERATED.test(resolve(cwd, p).split("\\").join("/")));
if (blocked.length > 0) {
  process.stderr.write(
    `${blocked.join(", ")} ${blocked.length > 1 ? "are" : "is"} generated. Change the source (src/content/**, scripts/generate-*.ts, or git history for changelog/buildMeta) and run \`npm run generate:all\`.\n`,
  );
  process.exit(2);
}
