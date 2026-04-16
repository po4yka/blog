# Blog Project

Personal portfolio, apps showcase, and technical blog for po4yka.dev.

## Tech Stack

- Astro 6 + React 19 + TypeScript (islands architecture)
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- Radix UI primitives
- Motion for animations
- MDX for blog content
- Zustand for client-side state (visitor preferences)
- TanStack Query for server state (admin CRUD)
- Cloudflare Workers + D1 (SQLite) for hosting and database
- React Router 7 for admin SPA routing
- SimpleWebAuthn for passkey/WebAuthn authentication

## Architecture

### Public Site (Static)

Pages are prerendered at build time. React islands hydrate via `client:load` or `client:visible`. Data comes from static TypeScript files (`blogData.ts`, `projectsData.ts`, `experienceData.ts`) and Astro content collections.

**Long-form MDX under `src/content/blog/{en,ru}/` may be authored in the sibling `havamal/` repo** and pushed here by `python3 scripts/sync_to_blog.py` in havamal (see `havamal/AGENTS.md § Sync to Blog`). Those MDX files are owned by the sync — edit the havamal `articles/<slug>/ARTICLE.md` source and re-run sync instead of hand-editing the MDX. Posts created directly with `/add-blog-post` are independent.

### Admin Panel (SSR)

Mounted at `/admin/*` as a React SPA. Uses TanStack Query hooks to fetch/mutate data through API routes backed by Cloudflare D1.

- Entry: `src/admin/App.tsx` (QueryClientProvider + AuthProvider + RouterProvider)
- API client: `src/admin/api.ts` (typed fetch wrapper with auth token)
- Query hooks: `src/admin/hooks/useAdminQueries.ts` (centralized query keys and hooks)
- Auth: `src/admin/hooks/useAuth.ts` + `src/admin/contexts/AuthContext.tsx` (passkey-first, password fallback)

### State Management

- **Visitor preferences** (`src/stores/settingsStore.ts`): Zustand with `persist` + `subscribeWithSelector`. Stores theme, reduceMotion, fontSize in localStorage. DOM side-effects applied via module-level `subscribe()`.
- **Admin data**: TanStack Query with server state in D1. No client-side store -- queries and mutations go through `/api/admin/*` routes.

### API Routes

Server-rendered Astro endpoints under `src/pages/api/`. Each exports `prerender = false`.

- `src/lib/admin-handler.ts` -- `withAdmin()` capability-scoped route wrapper (auth, CSRF, Zod validation, error handling)
- `src/lib/collections/define.ts` -- `defineCollection()` derives CRUD operations, Zod schemas, and route handlers from field definitions
- `src/lib/collections/{posts,projects,roles}.ts` -- entity definitions
- `src/lib/db.ts` -- data access layer; delegates posts/projects/roles to collections
- `src/lib/auth.ts` -- token-based session auth (D1 `admin_sessions` table)
- `src/lib/webauthn.ts` + `src/lib/webauthn-config.ts` -- WebAuthn/passkey credential storage
- Auth: passkey-first via WebAuthn (`@simplewebauthn/*`), password fallback via `ADMIN_PASSWORD` + `ALLOW_PASSWORD_LOGIN` env vars

### Database

Cloudflare D1 (SQLite). Schema in `db/schema.sql`, seed data in `db/seed.sql`, migrations in `db/migrations/`.

Tables: `blog_posts`, `projects`, `roles`, `categories`, `site_settings`, `admin_sessions`, `login_attempts`, `admin_credentials`, `auth_challenges`.

JSON arrays (tags, platforms, links) stored as TEXT, parsed in the data access layer (via `defineCollection` field type `"json"` or manual `parseJson`).

## Design

Read `docs/Guidelines.md` before any visual changes. Key rules:

- Minimal, credible, authored aesthetic -- not a generic AI portfolio
- Typography carries the design; restrained color palette with one accent family
- Motion supports clarity, never blocks reading
- Anti-AI-slop rules are mandatory

## Impeccable Design Skills

This project includes [Impeccable](https://impeccable.style) design skills in `.claude/skills/` for Claude and `.agents/skills/` for Codex.

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

Additional design engineering skills from [taste-skill](https://github.com/Leonxlnx/taste-skill) in `.claude/skills/` for Claude and `.agents/skills/` for Codex.

These supplement Impeccable with anti-AI-slop CSS patterns, output completeness, and parametric design dials.

Key skills:
- `/taste-skill` -- parametric design engineering (variance, motion, density dials)
- `/redesign-skill` -- visual pattern audit and upgrade checklist
- `/output-skill` -- prevents AI truncation and placeholder patterns
- `/minimalist-skill` -- editorial minimalism (Notion/Linear aesthetic)

These skills ban Inter font and purple accents by default. This project uses both intentionally. See `.claude/skills/taste-context/SKILL.md` for project overrides that take precedence.

Update skills: `bash scripts/update-taste-skills.sh`

## UI/UX Pro Max Skills

Design intelligence databases from [ui-ux-pro-max-skill](https://uupm.cc) providing searchable UI styles, color palettes, font pairings, and UX guidelines.

Key skills:
- `/ui-ux-pro-max` -- BM25 search over 67 styles, 161 palettes, 57 font pairings, Astro stack guide
- `/brand-system` -- brand voice, visual identity, messaging frameworks, asset validation
- `/slides` -- strategic HTML presentations with design tokens and copywriting formulas
- `/banner-design` -- multi-format banner creation for social/web/print
- `/design-tokens` -- reference docs for three-layer token architecture

These skills provide supplementary design intelligence. `DESIGN.md` and `src/styles/theme.css` always take precedence. See `.claude/skills/uiux-context/SKILL.md` for Claude overrides and `.agents/skills/uiux-context/SKILL.md` for Codex overrides.

Update skills: `bash scripts/update-uiux-pro-max.sh`

## Signal Deck Design System

Terminal-industrial design skill merging Nothing-style restraint with operator-console logic. Creates interfaces that feel like modern hardware control surfaces: precise, signal-driven, monochrome-dominant with phosphor accents.

Activate with: "signal deck", "signal-deck", "/signal-deck", "operator console style", "terminal modernism".

Key files:
- `/signal-deck` -- design philosophy, craft rules, anti-patterns, workflow
- `references/tokens.md` -- typography (IBM Plex Mono + Inter + JetBrains Mono), color system, spacing, motion, signal surfaces
- `references/components.md` -- 18 component types with editorial vs instrument panel modes
- `references/platform-mapping.md` -- HTML/CSS, React/Tailwind, SwiftUI, Jetpack Compose

## Vercel Agent Skills

React and web design skills from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills).

Key skills:
- `/web-design-guidelines` -- audits UI against 100+ rules (accessibility, focus states, touch targets, i18n, animation)
- `/composition-patterns` -- React component architecture (compound components, explicit variants, state lifting)
- `/react-best-practices` -- 57+ React/Next.js performance rules (bundle optimization, re-renders, data fetching)

Note: react-best-practices has a Next.js focus. Server actions, RSC-specific patterns, and `next/dynamic` rules don't apply to this Astro project. React island and general React rules do apply.

Update skills: `bash scripts/update-vercel-skills.sh`

## AccessLint Accessibility Skills

WCAG 2.1 accessibility auditing from [accesslint/claude-marketplace](https://github.com/accesslint/claude-marketplace). MCP server in `.claude/accesslint-mcp/` provides contrast ratio tools.

Key skills:
- `/accesslint-reviewer` -- comprehensive WCAG 2.1 code audit
- `/accesslint-contrast-checker` -- color contrast analysis (uses MCP tools)
- `/accesslint-refactor` -- automated accessibility fixes across files
- `/accesslint-use-of-color` -- WCAG 1.4.1 color-only information detection
- `/accesslint-link-purpose` -- WCAG 2.4.4 link text adequacy

## Project-Specific Skills

Custom skills encoding this project's unique patterns and workflows:

- `/add-admin-entity` -- scaffold full CRUD entity across 7+ files (schema, types, db, validation, API, hooks, page)
- `/add-island` -- add React island to Astro page with correct hydration, SSR guards, and motion
- `/add-api-route` -- create API route with D1 access, auth, and Zod validation
- `/add-terminal-block` -- create decorative MobileTerminal/Decoration component with MacWindow+motion pattern
- `/add-blog-post` -- create blog post (MDX source of truth, auto-generated data files)

## Custom Sub-Agents

Specialized agents in `.claude/agents/` for isolated, focused tasks:

- `code-reviewer` -- review changes against project conventions, anti-AI-slop rules, and Guidelines.md (haiku, read-only)
- `test-writer` -- generate Vitest unit tests with D1 mock pattern and Astro APIRoute testing conventions (sonnet)
- `build-check` -- run lint + build + test verification in background (haiku, background)
- `design-audit` -- audit visual components for design system compliance and anti-AI-slop violations (sonnet, preloads design skills)
- `content-sync` -- validate blog post consistency between MDX and blogData.ts (haiku, read-only)
- `security-check` -- scan API routes for missing auth, prerender guards, SQL injection, and secrets exposure (haiku, read-only)

Invoke via `@"agent-name"` mention or let Claude delegate automatically based on task context.

## Codex Skill Layout

Maintain Claude and Codex skills separately:
- Claude skills: `.claude/skills/`
- Codex skills: `.agents/skills/`
- Codex subagents: `.codex/agents/`

`.codex/skills/` is retired legacy layout and should not be updated or referenced.

## Conventions

- Components in `src/components/`, UI primitives in `src/components/ui/`
- Admin SPA in `src/admin/` (pages, hooks, contexts, api client)
- Server-side code in `src/lib/` (db, auth)
- API routes in `src/pages/api/`
- Stores in `src/stores/` (Zustand for client-side only)
- Styles: Tailwind utility classes preferred; global styles in `src/styles/`
- Path alias: `@` maps to `src/`
- No emoji in code or documentation

@docs/Guidelines.md
