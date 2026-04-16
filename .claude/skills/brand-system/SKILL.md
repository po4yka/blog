---
name: brand-system
description: "Brand voice, visual identity, messaging frameworks, asset management, brand consistency. Supplementary tooling for the po4yka.dev brand defined in DESIGN.md and docs/Guidelines.md."
argument-hint: "[update|review|create] [args]"
metadata:
  author: claudekit
  version: "1.0.0"
---

> **Project Override:** This project's brand is already defined in `DESIGN.md` and `docs/Guidelines.md`. This skill provides supplementary frameworks and validation tooling -- not a new brand. The terminal workstation aesthetic, Catppuccin Mocha palette, and JetBrains Mono typography are the established brand. Do not override them.

# Brand

Brand identity, voice, messaging, asset management, and consistency frameworks.

## When to Use

- Brand voice definition and content tone guidance
- Visual identity standards and style guide development
- Messaging framework creation
- Brand consistency review and audit
- Asset organization, naming, and approval
- Color palette management and typography specs

## Quick Start

**Inject brand context into prompts:**
```bash
node .claude/skills/brand-system/scripts/inject-brand-context.cjs
node .claude/skills/brand-system/scripts/inject-brand-context.cjs --json
```

**Validate an asset:**
```bash
node .claude/skills/brand-system/scripts/validate-asset.cjs <asset-path>
```

**Extract/compare colors:**
```bash
node .claude/skills/brand-system/scripts/extract-colors.cjs --palette
node .claude/skills/brand-system/scripts/extract-colors.cjs <image-path>
```

## Brand Sync Workflow

```bash
# 1. Edit docs/Guidelines.md (or use /brand update)
# 2. Sync to design tokens
node .claude/skills/brand-system/scripts/sync-brand-to-tokens.cjs
# 3. Verify
node .claude/skills/brand-system/scripts/inject-brand-context.cjs --json | head -20
```

**Files synced:**
- `docs/Guidelines.md` → Source of truth
- `DESIGN.md` → Design system specification
- `src/styles/theme.css` → CSS custom properties

## Subcommands

| Subcommand | Description | Reference |
|------------|-------------|-----------|
| `update` | Update brand identity and sync to all design systems | `references/update.md` |

## References

| Topic | File |
|-------|------|
| Voice Framework | `references/voice-framework.md` |
| Visual Identity | `references/visual-identity.md` |
| Messaging | `references/messaging-framework.md` |
| Consistency | `references/consistency-checklist.md` |
| Guidelines Template | `references/brand-guideline-template.md` |
| Asset Organization | `references/asset-organization.md` |
| Color Management | `references/color-palette-management.md` |
| Typography | `references/typography-specifications.md` |
| Logo Usage | `references/logo-usage-rules.md` |
| Approval Checklist | `references/approval-checklist.md` |

