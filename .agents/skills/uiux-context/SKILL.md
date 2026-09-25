---
name: uiux-context
description: "Project overrides for ui-ux-pro-max, brand-system, slides, banner-design, and design-tokens: required search flags and what their output may not override. Load with any of them."
---

# UI/UX Pro Max in this repo

Those skills are generic design databases. Treat their output as reference material; `DESIGN.md` and `src/styles/theme.css` define the actual system.

- Search with `--stack astro` (Astro 7 + React 19 islands + Tailwind CSS 4 via the Vite plugin, no Tailwind config file). Use `--domain` searches for supplementary guidance.
- Do not run `--design-system` to generate a new system, and do not adopt palette, font-pairing, or style recommendations: the palette is neutral greyscale with no chromatic accent, and fonts are fixed to Geist Sans, Geist Mono, and Piazzolla (blog prose only).
- Map component suggestions onto the existing primitives (`MacWindow`, `PanelShell`, `BootBlock`, `Cmd`, `OutputBlock`, `InfoTable`, `SectionHeader`) rather than adding card or SaaS-panel components.
