@AGENTS.md

## Claude Code

- `.claude/settings.json` registers a `PreToolUse` hook (`scripts/hooks/protect-generated.mjs`) that blocks `Edit`/`Write` on generated data files. Fix the source and run the generator instead of working around it.
- `.mcp.json` registers the project CMS MCP server (`.claude/cms-mcp/`, stdio). Build it once after cloning or changing its source: `npm ci --prefix .claude/cms-mcp && npm run build --prefix .claude/cms-mcp`.
