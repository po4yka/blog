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

## Taste Design Skills

Additional design engineering skills from [taste-skill](https://github.com/Leonxlnx/taste-skill) in `.claude/skills/` and `.codex/skills/`.

These supplement Impeccable with anti-AI-slop CSS patterns, output completeness, and parametric design dials.

Key skills:
- `/taste-skill` -- parametric design engineering (variance, motion, density dials)
- `/redesign-skill` -- visual pattern audit and upgrade checklist
- `/output-skill` -- prevents AI truncation and placeholder patterns
- `/minimalist-skill` -- editorial minimalism (Notion/Linear aesthetic)

These skills ban Inter font and purple accents by default. This project uses both intentionally. See `.claude/skills/taste-context/SKILL.md` for project overrides that take precedence.

Update skills: `bash scripts/update-taste-skills.sh`

## Conventions

- Components in `src/components/`, UI primitives in `src/components/ui/`
- Styles: Tailwind utility classes preferred; global styles in `src/styles/`
- Path alias: `@` maps to `src/`
- No emoji in code or documentation

@docs/Guidelines.md
