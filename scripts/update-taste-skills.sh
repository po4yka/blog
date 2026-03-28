#!/bin/bash
# Update taste-skill design skills to latest version from GitHub.
# Installs a curated subset (taste, redesign, output, minimalist) alongside Impeccable skills.
# Usage: bash scripts/update-taste-skills.sh
set -euo pipefail

REPO="https://github.com/Leonxlnx/taste-skill.git"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMP_DIR="$(mktemp -d)"
TASTE_SKILLS=(taste-skill redesign-skill output-skill minimalist-skill)

cleanup() { rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

echo "Cloning latest taste-skill..."
git clone --depth 1 "$REPO" "$TEMP_DIR/taste-skill" 2>/dev/null

echo "Updating Claude Code skills..."
for skill in "${TASTE_SKILLS[@]}"; do
  rm -rf "$PROJECT_ROOT/.claude/skills/$skill"
  cp -r "$TEMP_DIR/taste-skill/skills/$skill" "$PROJECT_ROOT/.claude/skills/$skill"
done

echo "Updating Codex skills..."
mkdir -p "$PROJECT_ROOT/.codex/skills"
for skill in "${TASTE_SKILLS[@]}"; do
  rm -rf "$PROJECT_ROOT/.codex/skills/$skill"
  cp -r "$TEMP_DIR/taste-skill/skills/$skill" "$PROJECT_ROOT/.codex/skills/$skill"
done

echo "Done. Taste skills updated on $(date +%Y-%m-%d)."
