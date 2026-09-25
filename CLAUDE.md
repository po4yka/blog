@AGENTS.md

## Claude Code

- `.claude/settings.json` registers a `PreToolUse` hook (`scripts/hooks/protect-generated.mjs`) that blocks `Edit`/`Write` on generated data files. Fix the source and run the generator instead of working around it.
