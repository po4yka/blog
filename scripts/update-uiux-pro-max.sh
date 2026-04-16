#!/bin/bash
# Update UI/UX Pro Max design skills from the local ui-ux-pro-max-skill repository.
# Copies skills, CSV databases, and Python search engine.
# Usage: bash scripts/update-uiux-pro-max.sh
set -euo pipefail

SOURCE="${UIUX_PRO_MAX_SOURCE:-$HOME/GitHub/ui-ux-pro-max-skill}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE_SKILLS_DIR="$PROJECT_ROOT/.claude/skills"
AGENTS_SKILLS_DIR="$PROJECT_ROOT/.agents/skills"

if [ ! -d "$SOURCE" ]; then
  echo "Error: source repo not found at $SOURCE"
  echo "Set UIUX_PRO_MAX_SOURCE to override the path."
  exit 1
fi

echo "Source: $SOURCE"
echo "Targets: $CLAUDE_SKILLS_DIR, $AGENTS_SKILLS_DIR"
echo ""

update_targets() {
  local skills_dir="$1"

  echo "Updating ui-ux-pro-max in $skills_dir..."
  rm -rf "$skills_dir/ui-ux-pro-max"
  mkdir -p "$skills_dir/ui-ux-pro-max"
  cp "$SOURCE/.claude/skills/ui-ux-pro-max/SKILL.md" "$skills_dir/ui-ux-pro-max/SKILL.md"
  cp -rL "$SOURCE/src/ui-ux-pro-max/data" "$skills_dir/ui-ux-pro-max/data"
  cp -rL "$SOURCE/src/ui-ux-pro-max/scripts" "$skills_dir/ui-ux-pro-max/scripts"

  echo "Updating brand-system in $skills_dir..."
  rm -rf "$skills_dir/brand-system"
  mkdir -p "$skills_dir/brand-system"
  cp -r "$SOURCE/.claude/skills/brand/references" "$skills_dir/brand-system/references"
  cp -r "$SOURCE/.claude/skills/brand/scripts" "$skills_dir/brand-system/scripts"
  cp -r "$SOURCE/.claude/skills/brand/templates" "$skills_dir/brand-system/templates"
  cp "$SOURCE/.claude/skills/brand/SKILL.md" "$skills_dir/brand-system/SKILL.md"

  echo "Updating slides in $skills_dir..."
  rm -rf "$skills_dir/slides"
  mkdir -p "$skills_dir/slides"
  cp "$SOURCE/.claude/skills/slides/SKILL.md" "$skills_dir/slides/SKILL.md"
  cp -r "$SOURCE/.claude/skills/slides/references" "$skills_dir/slides/references"

  echo "Updating banner-design in $skills_dir..."
  rm -rf "$skills_dir/banner-design"
  mkdir -p "$skills_dir/banner-design"
  cp "$SOURCE/.claude/skills/banner-design/SKILL.md" "$skills_dir/banner-design/SKILL.md"
  cp -r "$SOURCE/.claude/skills/banner-design/references" "$skills_dir/banner-design/references"

  echo "Updating design-tokens in $skills_dir..."
  rm -rf "$skills_dir/design-tokens/references"
  mkdir -p "$skills_dir/design-tokens/references"
  cp "$SOURCE/.claude/skills/design-system/references/token-architecture.md" "$skills_dir/design-tokens/references/"
  cp "$SOURCE/.claude/skills/design-system/references/primitive-tokens.md" "$skills_dir/design-tokens/references/"
  cp "$SOURCE/.claude/skills/design-system/references/semantic-tokens.md" "$skills_dir/design-tokens/references/"
  cp "$SOURCE/.claude/skills/design-system/references/component-tokens.md" "$skills_dir/design-tokens/references/"
  cp "$SOURCE/.claude/skills/design-system/references/states-and-variants.md" "$skills_dir/design-tokens/references/"
  cp "$SOURCE/.claude/skills/design-system/references/tailwind-integration.md" "$skills_dir/design-tokens/references/"
  if [ ! -f "$skills_dir/design-tokens/SKILL.md" ]; then
    echo "Warning: design-tokens/SKILL.md not found in $skills_dir. Create it manually."
  fi
}

mkdir -p "$CLAUDE_SKILLS_DIR" "$AGENTS_SKILLS_DIR"
update_targets "$CLAUDE_SKILLS_DIR"
update_targets "$AGENTS_SKILLS_DIR"

echo ""
echo "Done. UI/UX Pro Max skills updated on $(date +%Y-%m-%d)."
echo "Skills: ui-ux-pro-max, brand-system, slides, banner-design, design-tokens (refs)"
