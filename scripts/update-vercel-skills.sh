#!/bin/bash
# Update Vercel agent skills to latest version from GitHub.
# Installs web-design-guidelines, composition-patterns, react-best-practices.
# Usage: bash scripts/update-vercel-skills.sh
set -euo pipefail

REPO="https://github.com/vercel-labs/agent-skills.git"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMP_DIR="$(mktemp -d)"
VERCEL_SKILLS=(web-design-guidelines composition-patterns react-best-practices)

cleanup() { rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

echo "Cloning latest vercel agent-skills..."
git clone --depth 1 "$REPO" "$TEMP_DIR/agent-skills" 2>/dev/null

echo "Updating Claude Code skills..."
for skill in "${VERCEL_SKILLS[@]}"; do
  rm -rf "$PROJECT_ROOT/.claude/skills/$skill"
  cp -r "$TEMP_DIR/agent-skills/skills/$skill" "$PROJECT_ROOT/.claude/skills/$skill"
done

echo "Updating Codex skills..."
mkdir -p "$PROJECT_ROOT/.codex/skills"
for skill in "${VERCEL_SKILLS[@]}"; do
  rm -rf "$PROJECT_ROOT/.codex/skills/$skill"
  cp -r "$TEMP_DIR/agent-skills/skills/$skill" "$PROJECT_ROOT/.codex/skills/$skill"
done

echo "Done. Vercel skills updated on $(date +%Y-%m-%d)."
