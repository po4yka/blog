# Blog Project

Personal portfolio, apps showcase, and technical blog for po4yka.dev.

## Tech Stack

- Astro 6 + React 18 + TypeScript
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- Radix UI primitives + shadcn/ui components
- Motion (Framer Motion) for animations
- MDX for blog content

## Design

Read `docs/Guidelines.md` before any visual changes. Key rules:

- Minimal, credible, authored aesthetic -- not a generic AI portfolio
- Typography carries the design; restrained color palette with one accent family
- Motion supports clarity, never blocks reading
- Anti-AI-slop rules are mandatory

## Impeccable Design Skills

This project includes [Impeccable](https://impeccable.style) design skills in `.claude/skills/` and `.codex/skills/`.

Before design work, ensure `.impeccable.md` exists at the project root. If missing, run `/teach-impeccable` first.

Key skills:
- `/critique` -- UX review and heuristic evaluation
- `/audit` -- accessibility, performance, and quality scoring
- `/polish` -- final quality pass before shipping
- `/typeset` -- typography refinement
- `/animate` -- motion design (project uses Motion library)
- `/arrange` -- layout and spacing composition
- `/colorize` -- color palette and contrast
- `/adapt` -- responsive design
- `/normalize` -- design system consistency

Update skills: `bash scripts/update-impeccable.sh`

## Conventions

- Components in `src/components/`, UI primitives in `src/components/ui/`
- Styles: Tailwind utility classes preferred; global styles in `src/styles/`
- Path alias: `@` maps to `src/`
- No emoji in code or documentation

@docs/Guidelines.md
