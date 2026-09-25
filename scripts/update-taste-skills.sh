#!/bin/bash
# Update taste-skill design skills to latest version from GitHub.
# Installs a curated subset (taste, redesign, minimalist) alongside Impeccable skills.
# Usage: bash scripts/update-taste-skills.sh
set -euo pipefail

REPO="https://github.com/Leonxlnx/taste-skill.git"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMP_DIR="$(mktemp -d)"
TASTE_SKILLS=(taste-skill redesign-skill minimalist-skill)

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
perl -pi -e 's/^name: design-taste-frontend(\r?\n)/name: taste-skill$1/' "$PROJECT_ROOT/.claude/skills/taste-skill/SKILL.md"
perl -pi -e 's/^name: redesign-existing-projects(\r?\n)/name: redesign-skill$1/' "$PROJECT_ROOT/.claude/skills/redesign-skill/SKILL.md"
perl -pi -e 's/^name: minimalist-ui(\r?\n)/name: minimalist-skill$1/' "$PROJECT_ROOT/.claude/skills/minimalist-skill/SKILL.md"
perl -pi -e 's/^name: design-taste-frontend(\r?\n)/name: taste-skill$1/' "$PROJECT_ROOT/.agents/skills/taste-skill/SKILL.md"
perl -pi -e 's/^name: redesign-existing-projects(\r?\n)/name: redesign-skill$1/' "$PROJECT_ROOT/.agents/skills/redesign-skill/SKILL.md"
perl -pi -e 's/^name: minimalist-ui(\r?\n)/name: minimalist-skill$1/' "$PROJECT_ROOT/.agents/skills/minimalist-skill/SKILL.md"

echo "Re-applying skill routing policy..."
bash "$PROJECT_ROOT/scripts/apply-skill-policy.sh"

echo "Done. Taste skills updated on $(date +%Y-%m-%d)."
