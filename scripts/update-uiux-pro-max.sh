#!/bin/bash
# Update UI/UX Pro Max design skills from the local ui-ux-pro-max-skill repository.
# Copies skills, CSV databases, and Python search engine.
# Usage: bash scripts/update-uiux-pro-max.sh
set -euo pipefail

SOURCE="${UIUX_PRO_MAX_SOURCE:-$HOME/GitHub/ui-ux-pro-max-skill}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$PROJECT_ROOT/.claude/skills"

if [ ! -d "$SOURCE" ]; then
  echo "Error: source repo not found at $SOURCE"
  echo "Set UIUX_PRO_MAX_SOURCE to override the path."
  exit 1
fi

echo "Source: $SOURCE"
echo "Target: $SKILLS_DIR"
echo ""

# --- ui-ux-pro-max (main skill: SKILL.md + data + scripts) ---
echo "Updating ui-ux-pro-max..."
rm -rf "$SKILLS_DIR/ui-ux-pro-max"
mkdir -p "$SKILLS_DIR/ui-ux-pro-max"
cp "$SOURCE/.claude/skills/ui-ux-pro-max/SKILL.md" "$SKILLS_DIR/ui-ux-pro-max/SKILL.md"
# Copy actual files, not symlinks
cp -rL "$SOURCE/src/ui-ux-pro-max/data" "$SKILLS_DIR/ui-ux-pro-max/data"
cp -rL "$SOURCE/src/ui-ux-pro-max/scripts" "$SKILLS_DIR/ui-ux-pro-max/scripts"

# --- brand (copied as brand-system) ---
echo "Updating brand-system..."
rm -rf "$SKILLS_DIR/brand-system"
mkdir -p "$SKILLS_DIR/brand-system"
cp -r "$SOURCE/.claude/skills/brand/references" "$SKILLS_DIR/brand-system/references"
cp -r "$SOURCE/.claude/skills/brand/scripts" "$SKILLS_DIR/brand-system/scripts"
cp -r "$SOURCE/.claude/skills/brand/templates" "$SKILLS_DIR/brand-system/templates"
cp "$SOURCE/.claude/skills/brand/SKILL.md" "$SKILLS_DIR/brand-system/SKILL.md"

# --- slides ---
echo "Updating slides..."
rm -rf "$SKILLS_DIR/slides"
mkdir -p "$SKILLS_DIR/slides"
cp "$SOURCE/.claude/skills/slides/SKILL.md" "$SKILLS_DIR/slides/SKILL.md"
cp -r "$SOURCE/.claude/skills/slides/references" "$SKILLS_DIR/slides/references"

# --- banner-design ---
echo "Updating banner-design..."
rm -rf "$SKILLS_DIR/banner-design"
mkdir -p "$SKILLS_DIR/banner-design"
cp "$SOURCE/.claude/skills/banner-design/SKILL.md" "$SKILLS_DIR/banner-design/SKILL.md"
cp -r "$SOURCE/.claude/skills/banner-design/references" "$SKILLS_DIR/banner-design/references"

# --- design-tokens (references only from design-system) ---
echo "Updating design-tokens..."
rm -rf "$SKILLS_DIR/design-tokens/references"
mkdir -p "$SKILLS_DIR/design-tokens/references"
cp "$SOURCE/.claude/skills/design-system/references/token-architecture.md" "$SKILLS_DIR/design-tokens/references/"
cp "$SOURCE/.claude/skills/design-system/references/primitive-tokens.md" "$SKILLS_DIR/design-tokens/references/"
cp "$SOURCE/.claude/skills/design-system/references/semantic-tokens.md" "$SKILLS_DIR/design-tokens/references/"
cp "$SOURCE/.claude/skills/design-system/references/component-tokens.md" "$SKILLS_DIR/design-tokens/references/"
cp "$SOURCE/.claude/skills/design-system/references/states-and-variants.md" "$SKILLS_DIR/design-tokens/references/"
cp "$SOURCE/.claude/skills/design-system/references/tailwind-integration.md" "$SKILLS_DIR/design-tokens/references/"
# Preserve the custom SKILL.md (not from source)
if [ ! -f "$SKILLS_DIR/design-tokens/SKILL.md" ]; then
  echo "Warning: design-tokens/SKILL.md not found. Create it manually."
fi

echo ""
echo "Done. UI/UX Pro Max skills updated on $(date +%Y-%m-%d)."
echo "Skills: ui-ux-pro-max, brand-system, slides, banner-design, design-tokens (refs)"
