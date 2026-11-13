---
name: site-design
description: "po4yka.dev design rules. Load for any visual, layout, motion or copy-in-UI change under src/components, src/pages, src/styles, src/layouts or src/admin: which primitive to use, the hard bans, the real-output rule, and a before-you-finish checklist. Load this BEFORE frontend-design, polish, audit, critique or any better-* skill."
---

# Site design (po4yka.dev)

`DESIGN.md` is the source of truth. `docs/Guidelines.md` gives intent and tone. `.impeccable.md` holds the overrides for generic design skills. This skill gives the short path: what to use, what to avoid, and how to check. Each rule below points to a `DESIGN.md` section. Read the section before you change a rule or doubt it.

If a generic design skill or a user-level skill disagrees with `DESIGN.md`, `DESIGN.md` wins.

## Which primitive for which job

| Job | Use | Where |
|---|---|---|
| Any flat frame | `Panel` (never hand-write border, radius, background) | `src/components/ui/Panel.tsx`; DESIGN.md section 4, "Primitives" |
| Section or page heading | `SectionHeader` (`level={1}` on page headers) | `src/components/SectionHeader.tsx`; section 4, "SectionHeader"; numbers in section 9 |
| Content block with a numbered label | `OperatorPanel` | `src/components/Terminal/windows.tsx`; section 4, "OperatorPanel" |
| Compact real-data widget | `PanelShell` | `src/components/Decorations/_helpers.tsx`; section 4, "PanelShell" |
| Command line that introduces output | `Cmd` | `src/components/Terminal/commands.tsx` |
| Output of that command | `OutputBlock` | `src/components/Terminal/commands.tsx` |
| Key-value facts | `InfoTable`, `fieldCodes` for dense data | `src/components/Terminal/primitives.tsx` |
| Emphasis in text | `Em` (weight 500, `--emphasis`) | `src/components/Terminal/ui.tsx` |
| Entrance fade | `Reveal`, with `delay` in seconds | `src/components/ui/Reveal.tsx`; section 4, rule A1 |
| Server-only bilingual text | `T` | `src/components/ui/T.tsx` |
| Metadata strip, label after a number | `.label-meta` | `src/styles/theme.css` |
| Project identity mark | Plate (`plateArt`, `ditherField`) | `src/lib/plate.ts`, `src/lib/dither.ts`; section 4, "Project Plates", rule A8 |
| Blog prose | `.prose-blog` (Piazzolla body only); `.display-serif` on post, blog-index and home post-row titles | `src/styles/prose.css` (`.prose-blog`), `src/styles/theme.css` (`.display-serif`); section 9, "Typography guidance" |

Piazzolla lanes: body text of `.prose-blog`, plus post titles, blog-index titles and the post titles in the home writing rows. Headings inside prose stay Geist Sans. Geist Mono is for code, terminal output and `.label-meta`. Geist Pixel is for decorative counters only.

`BootBlock` (`OK ·`, `INFO ·`, `WARN ·`) is for real status only, at most 6 lines. It is not filler. If there is no real status, omit the block.

New island: load `add-island` after this skill. New data panel: load `add-data-panel`. Use `Reveal` for entrance fades, not a hand-written Motion fade.

## Hard bans

| Ban | DESIGN.md anchor |
|---|---|
| Chromatic accent, `text-accent`, `bg-accent`, deleted tokens (`--accent*`, `--phosphor-glow`, `--signal-*`) | Section 7, "Don't" |
| Gradients, glassmorphism, shadows on flat surfaces | Section 6; section 7; rule A7 (one nav blur) |
| Radius above 2px, pill buttons | Section 4, "Buttons"; section 7 |
| Hover or tap that changes width, height, margin, position or scale | Rule A3 |
| `whileTap` scale or rotate, bounce, shake, wobble, float, `pulse-scale`, pulse loops | Section 9, "Motion guidance", "Not permitted" |
| Any motion outside the permitted list; new motion needs its own amendment | Rule A1 |
| Content at `opacity: 0` in server HTML; scroll-jacking | Rules A1, A2 |
| More than one decorative signature per viewport; two decorative blocks in a row | Rule A11 |
| Weights 300 or 650 outside the hero name | Rule A9 |
| `--font-mono` for prose or headings; serif outside blog prose and `.display-serif` titles | Section 9, "Typography guidance" |
| ASCII art, Matrix or hacker styling, scanlines, cursor-glow, parallax | Section 7 |
| Generic SaaS card grids | Section 7 |
| Deleted components (`TrafficLights`, `CpuMonitor`, `FastlaneDeploy`, `BlogStatsPanel`, and others) | Section 10 |
| Raw duration numbers in new code | Section 9, "Motion guidance" (use `--dur-*` tokens) |

## Real-output rule

A panel needs a real data source. If there is none, the panel does not exist (section 7; section 10, closing paragraph).

- Terminal and status output prints facts from repo data (`projects.json`, `experience.json`, `blogMeta`, `buildMeta`, git history, the GitHub API) or a real captured run of a real tool (section 7, "Do"). Name the source before you write the line.
- Never narrate a page load. Lines such as `Loaded po4yka.dev/projects`, `Mounted`, `indexed` or `OK · ready` tell the reader nothing. Delete them or replace them with a fact only that page has.
- Never list files that the footer shell cannot open. Check `src/components/Terminal/commands/` (`allSlugs` in `cat.tsx`, `ls.tsx`, `open.tsx`) before you print a path.
- Seed generative art from real inputs and print the seed in the caption (rule A8).
- Show loading as a `LOADING` readout inside the final frame. No skeletons and no shimmer (section 6).

## Rules this project rejects from upstream skills

Ports of upstream skills must not bring these back. The site chose the opposite on purpose.

| Upstream rule | Source family | Site decision |
|---|---|---|
| Ban tracked uppercase mono labels | Hallmark, taste | `.label-meta` is the metadata voice (section 7, "Do") |
| Ban `01 /` section numbers and index numbers | Hallmark | Numbered `SectionHeader` is required (section 9) |
| Ban hairline rules, 1px boxes, registration marks | Hallmark, taste | 1px `--border` and `--rule` are the panel language (sections 4, 5, 6) |
| Ban mono outside code | taste, unslop | Mono is for code, terminal output and `.label-meta` (section 3) |
| Accent colour ramps, tinted neutrals | better-ui, better-colors, frontend-design | No chromatic accent (section 2, "Emphasis Rule") |
| Press feedback with `scale(0.97)` | emil-design-eng | `active:opacity-70` only (rule A3) |
| Motion floors ("every list must animate"), spring and bounce | emil-design-eng, animate | Only the rule A1 list; calm by default |
| Word budgets and hero copy limits | Hallmark, unslop | Voice rules live in the `voice` skill |
| Generated hero imagery, gradient blobs | Hallmark, taste | Plates and covers seeded by real inputs (rule A8) |

Take from these families only the ideas that do not contradict `DESIGN.md`: contrast, touch targets, focus order, hierarchy, alignment.

## Routing

| Task | Skill |
|---|---|
| New UI or visual change | `site-design`, then `add-island` or `add-data-panel` |
| Copy, labels, empty states, commit subjects | `voice` |
| Accessibility | `better-accessibility`, plus `accesslint-contrast-checker`, `accesslint-link-purpose` and `accesslint-use-of-color` for single checks |
| Layout and spacing | `better-layout` |
| Type | `better-typography`, with the font lanes above |
| Review a change before merge | `interface-review` |
| Review a whole surface | `better-interface` |
| Alignment pass | `polish`, under the overrides in `.impeccable.md` |

`animate`, `typeset`, `arrange`, `clarify`, `web-design-guidelines`, `accesslint-reviewer` and `accesslint-refactor` are user-invoked only (`scripts/apply-skill-policy.sh`). Use them only when the user names them.

## Before you finish

### Machine checks

- [ ] `npx vitest run src/__tests__/design-rules.test.ts` passes
- [ ] `npm run typecheck` passes
- [ ] The affected e2e spec passes, for example `npx playwright test e2e/reveal.spec.ts`
- [ ] `npm run lint` passes for `.ts` and `.tsx` edits

### Visual checks

- [ ] Look at the page at 375px and 1280px in the dark and the light theme.
- [ ] Reload with reduced motion on. Content must show in its final state.
- [ ] Touch targets are at least 44px below `md`.
- [ ] `e2e/visual.spec.ts` baselines (`e2e/visual.spec.ts-snapshots/`) run only in the CI `visual` job. They use reduced motion, the masks in the spec and `e2e/visual.css`. A layout change needs a baseline update from CI, not from a Mac.

### Judgment questions

- [ ] Name the real data source of every panel on the page. If you cannot, delete the panel.
- [ ] Does any fact appear twice on the page (hero, about, spec sheet, meta row, footer)? Keep one.
- [ ] Which element exists only on this site (real output, a seeded plate, a real revision)? If none, the page is generic.
- [ ] Count the decorative signatures in one viewport. More than one fails rule A11.
- [ ] Read every new string aloud. Apply the `voice` skill.
- [ ] Could this page belong to another developer after a name swap? If yes, rework it.
