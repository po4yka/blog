---
name: uiux-context
description: Project-specific overrides for ui-ux-pro-max, brand-system, slides, banner-design, and design-tokens skills. Read this before applying any UI/UX Pro Max skill recommendations.
---

# Project Overrides for UI/UX Pro Max Skills

The ui-ux-pro-max skill family provides generic design intelligence databases. The rules below define how those recommendations apply to this project. These overrides take precedence over any conflicting skill output.

## Stack

This project uses **Astro 6 + React 19 + Tailwind CSS 4** (Vite plugin, no config file). When using the search engine, always use `--stack astro`. Do not use `--stack react-native` or other mobile stacks.

## Design System

The project's design system is fully defined in `DESIGN.md` and implemented in `src/styles/theme.css`. Do **not** use `--design-system` to generate a new design system. Use `--domain` searches for supplementary guidance only.

## Color Palette

The project uses the **Catppuccin Mocha** palette with a single muted purple accent:
- Dark: `#191a21` background, `#24273a` card, `#9184f7` accent
- Light: `#f6f5f8` background, `#ffffff` card, `#6b5ce6` accent

Color palette recommendations from the search engine are reference material only. Never override the project palette.

## Typography

The project uses **JetBrains Mono** (primary, all UI) and **Inter** (blog prose only). Font pairing recommendations from the search engine are reference material only. Do not suggest alternative fonts.

## Components

The project uses **MacWindow**, **PanelShell**, **BootBlock**, **Cmd**, **OutputBlock**, and **InfoTable** as its primary design primitives -- not generic cards, SaaS panels, or mobile app components. Any component recommendations should be adapted to fit the terminal workstation aesthetic.

## Authority

`DESIGN.md` and `docs/Guidelines.md` always take precedence over any search results or skill recommendations. When in doubt, read those files first.

## Related Overrides

See also `.claude/skills/taste-context/SKILL.md` for taste-skill and redesign-skill overrides.
