---
name: taste-context
description: Project-specific overrides for taste-skill rules that conflict with this project's design system. Read this before applying any taste-skill, redesign-skill, output-skill, or minimalist-skill directives.
---

# Project Overrides for Taste Skills

The taste-skill family includes opinionated defaults that conflict with this project's established design system. The rules below take precedence over any conflicting taste-skill directives.

## Font Stack

This project uses **Inter** as its primary sans-serif and **JetBrains Mono** as its monospace font. These are deliberate choices documented in `docs/Guidelines.md`. Taste-skill rules that ban Inter do not apply here.

## Accent Color

This project uses a muted purple accent (`#9184f7` dark, `#6b5ce6` light) as its single accent family. This is an intentional choice, not "AI purple". Taste-skill rules banning purple/violet accents do not apply.

## Framework

This project uses **Astro 6 with React islands**, not Next.js. Ignore RSC-specific directives (`"use client"`, RSC Safety rules). Astro handles server/client boundaries via hydration directives (`client:load`, `client:visible`). Interactive components are React `.tsx` files rendered inside `.astro` layouts.

## Icon Library

This project uses **MUI Material Icons** (`@mui/icons-material`). Taste-skill mandates for Phosphor or Radix icons do not apply.

## Authority

When taste-skill rules conflict with `docs/Guidelines.md` or `CLAUDE.md`, the project documentation always wins.
