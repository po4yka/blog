#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE_DIR="$PROJECT_ROOT/.claude/skills"
AGENTS_DIR="$PROJECT_ROOT/.agents/skills"

if [ ! -d "$CLAUDE_DIR" ]; then
  echo "Missing Claude skills directory: $CLAUDE_DIR" >&2
  exit 1
fi

if [ ! -d "$AGENTS_DIR" ]; then
  echo "Missing Codex skills directory: $AGENTS_DIR" >&2
  exit 1
fi

TMP_CLAUDE="$(mktemp)"
TMP_AGENTS="$(mktemp)"
trap 'rm -f "$TMP_CLAUDE" "$TMP_AGENTS"' EXIT

find "$CLAUDE_DIR" -mindepth 1 -maxdepth 1 -type d | sed 's#.*/##' | sort > "$TMP_CLAUDE"
find "$AGENTS_DIR" -mindepth 1 -maxdepth 1 -type d | sed 's#.*/##' | sort > "$TMP_AGENTS"

MISSING_SKILLS="$(comm -23 "$TMP_CLAUDE" "$TMP_AGENTS" || true)"
if [ -n "$MISSING_SKILLS" ]; then
  echo "Codex skill parity check failed. Missing in .agents/skills:" >&2
  echo "$MISSING_SKILLS" >&2
  exit 1
fi

BANNED_GLOBS=(
  -g 'SKILL.md'
  -g '*.md'
  -g '*.json'
  -g '*.cjs'
  -g '*.js'
  -g '*.mjs'
  -g '*.py'
)

set +e
rg -n \
  "${BANNED_GLOBS[@]}" \
  -e 'AskUserQuestion' \
  -e 'Skill\(' \
  -e 'allowed-tools:' \
  -e 'WebFetch' \
  -e 'Task calls' \
  -e 'Launch one Task agent' \
  -e 'Claude subagents' \
  -e '--runner claude' \
  -e '## Claude Code Overlay' \
  -e '\.claude/skills/' \
  "$AGENTS_DIR"
RG_STATUS=$?
set -e

if [ "$RG_STATUS" -eq 0 ]; then
  echo "" >&2
  echo "Codex skill lint failed. Remove Claude-specific directives from .agents/skills." >&2
  exit 1
fi

if [ "$RG_STATUS" -ne 1 ]; then
  echo "Codex skill lint failed to run." >&2
  exit "$RG_STATUS"
fi

echo "Codex skills validated successfully."
