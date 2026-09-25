#!/bin/bash
# Mark vendored skills whose defaults contradict DESIGN.md (color, boldness,
# heavy motion, greenfield redesigns, generic palettes) as explicit-invocation
# only, for both runtimes:
#   Claude Code: `disable-model-invocation: true` in SKILL.md frontmatter
#   Codex:       `policy.allow_implicit_invocation: false` in agents/openai.yaml
# The skills stay available via /name (Claude) or $name (Codex).
# Update scripts overwrite vendored skills, so re-run this afterwards.
# Usage: bash scripts/apply-skill-policy.sh [--check]
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHECK=0
[ "${1:-}" = "--check" ] && CHECK=1

MANUAL_ONLY=(
  # Impeccable: push toward color, intensity, or effects the design system bans
  bolder colorize delight overdrive onboard extract teach-impeccable
  # taste-skill: generic premium/redesign defaults
  taste-skill redesign-skill minimalist-skill
  # UI/UX Pro Max: generic palettes, fonts, and brand kits
  ui-ux-pro-max brand-system slides banner-design design-tokens
  # Greenfield design skill
  hallmark
  # Superseded in-repo design system (phosphor accents, IBM Plex)
  signal-deck
)

# Print the YAML frontmatter block (between the first two --- lines).
frontmatter() { awk 'NR==1 && /^---/ {f=1; next} f && /^---/ {exit} f' "$1"; }

drift=0
for skill in "${MANUAL_ONLY[@]}"; do
  claude_md="$PROJECT_ROOT/.claude/skills/$skill/SKILL.md"
  codex_yaml="$PROJECT_ROOT/.agents/skills/$skill/agents/openai.yaml"

  if [ ! -f "$claude_md" ] || [ ! -d "$PROJECT_ROOT/.agents/skills/$skill" ]; then
    echo "missing skill: $skill" >&2
    drift=1
    continue
  fi

  if ! frontmatter "$claude_md" | grep -q '^disable-model-invocation: true$'; then
    if [ "$CHECK" -eq 1 ]; then
      echo "not manual-only for Claude: $skill" >&2
      drift=1
    else
      # Insert right after the opening --- of the frontmatter.
      awk 'NR==1 && /^---/ {print; print "disable-model-invocation: true"; next} {print}' \
        "$claude_md" > "$claude_md.tmp" && mv "$claude_md.tmp" "$claude_md"
      if ! frontmatter "$claude_md" | grep -q '^disable-model-invocation: true$'; then
        echo "could not set disable-model-invocation in $claude_md (no frontmatter?)" >&2
        drift=1
      fi
    fi
  fi

  if ! grep -q 'allow_implicit_invocation: false' "$codex_yaml" 2>/dev/null; then
    if [ "$CHECK" -eq 1 ]; then
      echo "not manual-only for Codex: $skill" >&2
      drift=1
    elif grep -qE '^policy:|allow_implicit_invocation' "$codex_yaml" 2>/dev/null; then
      echo "conflicting policy in $codex_yaml; fix by hand" >&2
      drift=1
    else
      mkdir -p "$(dirname "$codex_yaml")"
      # Keep the appended block on its own line if the file lacks a trailing newline.
      if [ -s "$codex_yaml" ] && [ -n "$(tail -c1 "$codex_yaml")" ]; then echo >> "$codex_yaml"; fi
      printf 'policy:\n  allow_implicit_invocation: false\n' >> "$codex_yaml"
    fi
  fi
done

exit "$drift"
