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
mkdir -p "$PROJECT_ROOT/.agents/skills"
for skill in "${TASTE_SKILLS[@]}"; do
  rm -rf "$PROJECT_ROOT/.agents/skills/$skill"
  cp -r "$TEMP_DIR/taste-skill/skills/$skill" "$PROJECT_ROOT/.agents/skills/$skill"
done

# Fix upstream name: field mismatches (align with directory names)
echo "Fixing skill name fields..."
sed -i '' 's/^name: design-taste-frontend$/name: taste-skill/' "$PROJECT_ROOT/.claude/skills/taste-skill/SKILL.md"
sed -i '' 's/^name: redesign-existing-projects$/name: redesign-skill/' "$PROJECT_ROOT/.claude/skills/redesign-skill/SKILL.md"
sed -i '' 's/^name: full-output-enforcement$/name: output-skill/' "$PROJECT_ROOT/.claude/skills/output-skill/SKILL.md"
sed -i '' 's/^name: minimalist-ui$/name: minimalist-skill/' "$PROJECT_ROOT/.claude/skills/minimalist-skill/SKILL.md"
sed -i '' 's/^name: design-taste-frontend$/name: taste-skill/' "$PROJECT_ROOT/.agents/skills/taste-skill/SKILL.md"
sed -i '' 's/^name: redesign-existing-projects$/name: redesign-skill/' "$PROJECT_ROOT/.agents/skills/redesign-skill/SKILL.md"
sed -i '' 's/^name: full-output-enforcement$/name: output-skill/' "$PROJECT_ROOT/.agents/skills/output-skill/SKILL.md"
sed -i '' 's/^name: minimalist-ui$/name: minimalist-skill/' "$PROJECT_ROOT/.agents/skills/minimalist-skill/SKILL.md"

echo "Done. Taste skills updated on $(date +%Y-%m-%d)."
