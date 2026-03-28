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

echo "Updating Claude Code skills..."
rm -r "$PROJECT_ROOT/.claude/skills"
cp -r "$TEMP_DIR/impeccable/.claude/skills" "$PROJECT_ROOT/.claude/skills"

echo "Updating Codex skills..."
rm -r "$PROJECT_ROOT/.codex/skills"
cp -r "$TEMP_DIR/impeccable/.codex/skills" "$PROJECT_ROOT/.codex/skills"

echo "Done. Skills updated on $(date +%Y-%m-%d)."
