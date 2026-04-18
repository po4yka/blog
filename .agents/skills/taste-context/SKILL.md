---
name: taste-context
description: Project-specific overrides for taste-skill rules that conflict with this project's design system. Read this before applying any taste-skill, redesign-skill, output-skill, or minimalist-skill directives.
---

# Project Overrides for Taste Skills

The taste-skill family includes opinionated defaults that conflict with this project's established design system. The rules below take precedence over any conflicting taste-skill directives.

## Font Stack

This project uses **Geist Sans** (`--font-sans`) for site chrome and all headings (including h2/h3/h4 inside blog prose), **Geist Mono** (`--font-mono`) for code blocks, terminal output, and `.label-meta` strips, and **Piazzolla** (`--font-serif`, variable serif with native Cyrillic) exclusively for blog post body prose inside `.prose-blog`. Documented in `docs/Guidelines.md` and `DESIGN.md`. Taste-skill bans on Inter do not apply because the project does not use Inter anywhere.

## Accent Color

This project has **no chromatic accent**. Emphasis is carried by `--emphasis` (pure white on dark, pure black on light) combined with font weight and 1px underline rules. `--destructive` (`#e8634b` dark / `#b83a28` light) is the only non-neutral token and is strictly reserved for irreversible destructive actions. Taste-skill rules banning coloured accents align with the project — apply them.

## Framework

This project uses **Astro 6 with React islands**, not Next.js. Ignore RSC-specific directives (`"use client"`, RSC Safety rules). Astro handles server/client boundaries via hydration directives (`client:load`, `client:visible`). Interactive components are React `.tsx` files rendered inside `.astro` layouts.

## Icon Library

This project primarily uses **Lucide React** (`lucide-react`). Taste-skill mandates for Phosphor or MUI icons do not apply.

## Authority

When taste-skill rules conflict with `docs/Guidelines.md` or `AGENTS.md`, the project documentation always wins.

## Related Overrides

See also `.agents/skills/uiux-context/SKILL.md` for UI/UX Pro Max skill overrides.
