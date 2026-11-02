#!/bin/bash
# Update Vercel agent skills to a reviewed commit from GitHub.
# Installs web-design-guidelines, composition-patterns, react-best-practices.
# Usage: bash scripts/update-vercel-skills.sh <commit-sha>
# The commit is required: the skill text becomes agent instructions, so read the upstream diff since
# the previous update first, and name the commit in the commit message that vendors the update.
set -euo pipefail

REPO="https://github.com/vercel-labs/agent-skills.git"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="${1:-}"
if [[ ! "$REF" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: bash $0 <commit-sha>: a reviewed 40-character commit of $REPO" >&2
  exit 1
fi
TEMP_DIR="$(mktemp -d)"
VERCEL_SKILLS=(web-design-guidelines composition-patterns react-best-practices)

cleanup() { rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

echo "Fetching agent-skills at $REF..."
git init -q "$TEMP_DIR/agent-skills"
git -C "$TEMP_DIR/agent-skills" fetch -q --depth 1 "$REPO" "$REF"
git -C "$TEMP_DIR/agent-skills" checkout -q FETCH_HEAD

echo "Updating Claude Code skills..."
for skill in "${VERCEL_SKILLS[@]}"; do
  rm -rf "$PROJECT_ROOT/.claude/skills/$skill"
  cp -r "$TEMP_DIR/agent-skills/skills/$skill" "$PROJECT_ROOT/.claude/skills/$skill"
done

echo "Updating Codex skills..."
mkdir -p "$PROJECT_ROOT/.agents/skills"
for skill in "${VERCEL_SKILLS[@]}"; do
  rm -rf "$PROJECT_ROOT/.agents/skills/$skill"
  cp -r "$TEMP_DIR/agent-skills/skills/$skill" "$PROJECT_ROOT/.agents/skills/$skill"
done

# Fix upstream name: field mismatches (align with directory names)
echo "Fixing skill name fields..."
perl -pi -e 's/^name: vercel-composition-patterns(\r?\n)/name: composition-patterns$1/' "$PROJECT_ROOT/.claude/skills/composition-patterns/SKILL.md"
perl -pi -e 's/^name: vercel-react-best-practices(\r?\n)/name: react-best-practices$1/' "$PROJECT_ROOT/.claude/skills/react-best-practices/SKILL.md"
perl -pi -e 's/^name: vercel-composition-patterns(\r?\n)/name: composition-patterns$1/' "$PROJECT_ROOT/.agents/skills/composition-patterns/SKILL.md"
perl -pi -e 's/^name: vercel-react-best-practices(\r?\n)/name: react-best-practices$1/' "$PROJECT_ROOT/.agents/skills/react-best-practices/SKILL.md"

echo "Re-applying skill routing policy..."
bash "$PROJECT_ROOT/scripts/apply-skill-policy.sh"

echo "Done. Vercel skills updated to $REF on $(date +%Y-%m-%d)."
