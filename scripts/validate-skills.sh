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

# Each skill's frontmatter name must match its directory (Agent Skills spec).
NAME_ERRORS=0
for skill_md in "$CLAUDE_DIR"/*/SKILL.md "$AGENTS_DIR"/*/SKILL.md; do
  dir_name="$(basename "$(dirname "$skill_md")")"
  fm_name="$(awk 'NR==1 && /^---/ {f=1; next} f && /^---/ {exit} f && /^name:/ {sub(/^name:[ ]*/, ""); gsub(/"/, ""); print; exit}' "$skill_md")"
  if [ "$fm_name" != "$dir_name" ]; then
    echo "Skill name mismatch: $skill_md declares '$fm_name'" >&2
    NAME_ERRORS=1
  fi
done

# Repo-owned skills are symlinks from .claude/skills into .agents/skills.
for link in "$CLAUDE_DIR"/*; do
  [ -L "$link" ] || continue
  name="$(basename "$link")"
  if [ "$(readlink "$link")" != "../../.agents/skills/$name" ] || [ ! -f "$link/SKILL.md" ]; then
    echo "Broken skill symlink: $link -> $(readlink "$link")" >&2
    NAME_ERRORS=1
  fi
done

if [ "$NAME_ERRORS" -ne 0 ]; then
  exit 1
fi

if ! bash "$PROJECT_ROOT/scripts/apply-skill-policy.sh" --check; then
  echo "Skill routing policy drifted. Run: bash scripts/apply-skill-policy.sh" >&2
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

# Skills installed by the `skills` CLI (skills-lock.json) are shared by both
# runtimes upstream; they are not rewritten per runtime, so skip them here.
LOCKED_SKILLS="$(node -e 'console.log(Object.keys(require(process.argv[1]).skills).join("\n"))' "$PROJECT_ROOT/skills-lock.json")"
LOCKED_EXCLUDES=(-g '!**/.git/**')
for locked in $LOCKED_SKILLS; do
  LOCKED_EXCLUDES+=(-g "!**/$locked/**")
done

set +e
rg -n \
  "${BANNED_GLOBS[@]}" \
  "${LOCKED_EXCLUDES[@]}" \
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

echo "Skills validated successfully."
