#!/bin/bash
# Update the vendored jakubkrehel/skills interface skills to a reviewed commit from GitHub.
# Usage: bash scripts/update-interfaces.sh <commit-sha>
# The commit is required: the skill text becomes agent instructions, so read the upstream diff since
# the previous update first, and name the commit in the commit message that vendors the update.
#
# Only six skills are vendored:
#   better-accessibility, better-layout, better-writing, better-typography,
#   better-interface, interface-review
# Left out on purpose:
#   better-ui and better-colors contradict DESIGN.md (motion rules and the no-accent rule).
#   teardown, build-design, explain-interface, variant, break, and state-machine are out of scope.
# The upstream skills are the same for both runtimes, so each one is copied to .agents/skills/
# (Codex) and .claude/skills/ (Claude Code) as a real copy, like the Impeccable skills.
set -euo pipefail

REPO="https://github.com/jakubkrehel/skills.git"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="${1:-}"
if [[ ! "$REF" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: bash $0 <commit-sha>: a reviewed 40-character commit of $REPO" >&2
  exit 1
fi
TEMP_DIR="$(mktemp -d)"

cleanup() { rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

echo "Fetching jakubkrehel/skills at $REF..."
git init -q "$TEMP_DIR/skills"
git -C "$TEMP_DIR/skills" fetch -q --depth 1 "$REPO" "$REF"
git -C "$TEMP_DIR/skills" checkout -q FETCH_HEAD

INTERFACE_SKILLS=(better-accessibility better-layout better-writing better-typography
  better-interface interface-review)

for skill in "${INTERFACE_SKILLS[@]}"; do
  if [ ! -f "$TEMP_DIR/skills/skills/$skill/SKILL.md" ]; then
    echo "missing upstream skill: $skill" >&2
    exit 1
  fi
done

for target in .claude/skills .agents/skills; do
  echo "Updating $target..."
  mkdir -p "$PROJECT_ROOT/$target"
  for skill in "${INTERFACE_SKILLS[@]}"; do
    rm -rf "${PROJECT_ROOT:?}/$target/$skill"
    cp -r "$TEMP_DIR/skills/skills/$skill" "$PROJECT_ROOT/$target/$skill"
  done
done

echo "Re-applying skill routing policy..."
bash "$PROJECT_ROOT/scripts/apply-skill-policy.sh"

echo "Done. Skills updated to $REF on $(date +%Y-%m-%d)."
