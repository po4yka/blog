#!/usr/bin/env node
// Claude Code PreToolUse hook: block direct edits to generated data files.
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
const filePath = input?.tool_input?.file_path;
if (typeof filePath !== "string") process.exit(0);

const abs = resolve(input.cwd ?? process.cwd(), filePath).split("\\").join("/");
if (GENERATED.test(abs)) {
  process.stderr.write(
    `${filePath} is generated. Change its source (src/content/**, scripts/generate-*.ts, or git history for changelog/buildMeta) and run \`npm run generate:all\`.\n`,
  );
  process.exit(2);
}
