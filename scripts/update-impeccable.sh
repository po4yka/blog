#!/bin/bash
# Update Impeccable design skills to latest version from GitHub.
# Usage: bash scripts/update-impeccable.sh
set -euo pipefail

REPO="https://github.com/pbakaus/impeccable.git"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMP_DIR="$(mktemp -d)"

cleanup() { rm -r "$TEMP_DIR"; }
trap cleanup EXIT

echo "Cloning latest impeccable..."
git clone --depth 1 "$REPO" "$TEMP_DIR/impeccable" 2>/dev/null

IMPECCABLE_SKILLS=(adapt animate arrange audit bolder clarify colorize critique
  delight distill extract frontend-design harden normalize onboard optimize
  overdrive polish quieter teach-impeccable typeset)

echo "Updating Claude Code skills..."
for skill in "${IMPECCABLE_SKILLS[@]}"; do
  rm -rf "$PROJECT_ROOT/.claude/skills/$skill"
done
cp -r "$TEMP_DIR/impeccable/.claude/skills/"* "$PROJECT_ROOT/.claude/skills/"

echo "Updating Codex skills..."
for skill in "${IMPECCABLE_SKILLS[@]}"; do
  rm -rf "$PROJECT_ROOT/.codex/skills/$skill"
done
cp -r "$TEMP_DIR/impeccable/.codex/skills/"* "$PROJECT_ROOT/.codex/skills/"

echo "Done. Skills updated on $(date +%Y-%m-%d)."
