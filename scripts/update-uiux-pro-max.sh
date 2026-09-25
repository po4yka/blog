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

# Project note re-inserted after every refresh: upstream SKILL.md does not
# know this repo, and the override points at the uiux-context skill.
PROJECT_OVERRIDE='> **Project Override:** This project is a personal developer portfolio/blog (po4yka.dev) using Astro 7 + React 19 + Tailwind CSS 4. The design system is fully defined in `DESIGN.md` and `src/styles/theme.css`. Read those files before making any design decisions. Load the `uiux-context` skill for the project overrides that take precedence over this skill'\''s generic recommendations.'

insert_project_override() {
  local skill_md="$1"
  awk -v note="$PROJECT_OVERRIDE" '
    { print }
    /^---$/ && ++fences == 2 && !done { print ""; print note; done = 1 }
  ' "$skill_md" > "$skill_md.tmp" && mv "$skill_md.tmp" "$skill_md"
}

update_targets() {
  local skills_dir="$1"

  echo "Updating ui-ux-pro-max in $skills_dir..."
  rm -rf "$skills_dir/ui-ux-pro-max"
  mkdir -p "$skills_dir/ui-ux-pro-max"
  cp "$SOURCE/.claude/skills/ui-ux-pro-max/SKILL.md" "$skills_dir/ui-ux-pro-max/SKILL.md"
  insert_project_override "$skills_dir/ui-ux-pro-max/SKILL.md"
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

echo "Re-applying skill routing policy..."
bash "$PROJECT_ROOT/scripts/apply-skill-policy.sh"

echo ""
echo "Done. UI/UX Pro Max skills updated on $(date +%Y-%m-%d)."
echo "Skills: ui-ux-pro-max, brand-system, slides, banner-design, design-tokens (refs)"
