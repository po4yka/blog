#!/bin/bash
# Update Impeccable design skills to a reviewed commit from GitHub.
# Usage: bash scripts/update-impeccable.sh <commit-sha>
# The commit is required: the skill text becomes agent instructions, so read the upstream diff since
# the previous update first, and name the commit in the commit message that vendors the update.
set -euo pipefail

REPO="https://github.com/pbakaus/impeccable.git"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="${1:-}"
if [[ ! "$REF" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: bash $0 <commit-sha>: a reviewed 40-character commit of $REPO" >&2
  exit 1
fi
TEMP_DIR="$(mktemp -d)"

cleanup() { rm -r "$TEMP_DIR"; }
trap cleanup EXIT

echo "Fetching impeccable at $REF..."
git init -q "$TEMP_DIR/impeccable"
git -C "$TEMP_DIR/impeccable" fetch -q --depth 1 "$REPO" "$REF"
git -C "$TEMP_DIR/impeccable" checkout -q FETCH_HEAD

IMPECCABLE_SKILLS=(adapt animate arrange audit bolder clarify colorize critique
  delight distill extract frontend-design harden normalize onboard optimize
  overdrive polish quieter teach-impeccable typeset)

echo "Updating Claude Code skills..."
for skill in "${IMPECCABLE_SKILLS[@]}"; do
  rm -rf "$PROJECT_ROOT/.claude/skills/$skill"
done
cp -r "$TEMP_DIR/impeccable/.claude/skills/"* "$PROJECT_ROOT/.claude/skills/"

echo "Updating Codex skills..."
mkdir -p "$PROJECT_ROOT/.agents/skills"
for skill in "${IMPECCABLE_SKILLS[@]}"; do
  rm -rf "$PROJECT_ROOT/.agents/skills/$skill"
done
cp -r "$TEMP_DIR/impeccable/.codex/skills/"* "$PROJECT_ROOT/.agents/skills/"

echo "Re-applying skill routing policy..."
bash "$PROJECT_ROOT/scripts/apply-skill-policy.sh"

echo "Done. Skills updated to $REF on $(date +%Y-%m-%d)."
