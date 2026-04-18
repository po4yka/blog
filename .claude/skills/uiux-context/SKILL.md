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

The project uses a strictly neutral greyscale palette with **no chromatic accent**:
- Dark: `#0b0b0c` background, `#141416` card, `#e9e8e4` eggshell text, `#ffffff` `--emphasis`
- Light: `#f5f3ee` warm paper, `#ffffff` card, `#101012` ink text, `#000000` `--emphasis`
- Emphasis is carried by weight + 1px underline + `--emphasis`; `--destructive` is reserved for irreversible actions only

Color palette recommendations from the search engine are reference material only. Never override the project palette.

## Typography

The project uses **Geist Sans** (site chrome + all headings, including inside blog prose), **Geist Mono** (code + operator labels + `.label-meta`), and **Piazzolla** (variable serif with Cyrillic, exclusively inside `.prose-blog` body text). Font pairing recommendations from the search engine are reference material only. Do not suggest alternative fonts.

## Components

The project uses **MacWindow**, **PanelShell**, **BootBlock**, **Cmd**, **OutputBlock**, and **InfoTable** as its primary design primitives -- not generic cards, SaaS panels, or mobile app components. Any component recommendations should be adapted to fit the terminal workstation aesthetic.

## Authority

`DESIGN.md` and `docs/Guidelines.md` always take precedence over any search results or skill recommendations. When in doubt, read those files first.

## Related Overrides

See also `.claude/skills/taste-context/SKILL.md` for taste-skill and redesign-skill overrides.
