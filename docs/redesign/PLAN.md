# po4yka.dev redesign plan

Status: proposal for owner review, revision 2 (after an independent critique). No site code has been changed. Research is in `docs/redesign/research.md`. This plan reads source only; no build, bundle measurement, Lighthouse run or browser check was done, so every size and score below is an estimate until Phase 0 measures it.

## 1. Goal and design thesis

The redesign keeps the identity of the site: a monochrome Swiss surface with an operator-console layer, flat 2px panels, Geist and Piazzolla, and real data only. It changes the pace and the ambition. Today the site is correct but quiet: motion is almost all opacity fades, every home section has the same shape, the hero has no moment, and the best idea (the terminal) sits at the bottom of the page. The new direction is "instrument grade": the page behaves like a precision instrument that wakes up, draws its own grid, prints its own name in dither, and answers the pointer, while the text stays plain HTML.

The target is "stunning", not "tidy". Ambition is controlled by a budget per piece (section 8), not by a ban on ambition.

Design principles:

1. **Text first, effects second.** Every word is in the static HTML. Every effect is a layer on top and has a complete no-JS, no-motion state. The `h1` stays the LCP element.
2. **Motion carries state.** Draw-ons show structure, scroll progress shows position, decode shows a value that changed, and transitions show where you came from. Motion that carries none of these is removed.
3. **Depth from luminance, not color.** Hairlines, tone steps, dither density, opacity and weight. No chromatic accent, no glow, no shadow.
4. **One signature per screen.** Each viewport gets one memorable thing and the rest stays calm. The hero field (name dither, data density and pointer response) counts as one signature because it is one layer. The 6 to 8 block atmosphere cap in `DESIGN.md` is replaced by this rule.
5. **Cheapest tool first.** CSS, then Motion already in the bundle, then a small custom script, then Canvas 2D. WebGL is a deferred option that needs a failed measurement first.
6. **Real data only.** Every generative piece is seeded by a real input and its caption names the input.

## 2. Current state summary

- **Stack:** Astro 7 static pages with React 19 islands, Tailwind 4 (CSS-first, no config file), Motion 13, Astro `ClientRouter` for every navigation. Nav, Footer, KeyboardShortcuts and StatusLine are persisted (`src/layouts/MainLayout.astro` lines 76 to 94).
- **Home:** `src/pages/index.astro` is a flat stack of nine islands. Only `Hero` is `client:load`. Eight are `client:visible`, and four of those (`Projects`, `Experience`, `Links`, `BlogPreview`) have no motion of their own yet still ship React, Motion and the settings store. Selectors `[data-section-name]` and `:has(> astro-island:empty)` are load-bearing for e2e tests.
- **Motion today:** `src/lib/motion.ts` holds durations (0.15, 0.3, 0.45), one quint ease, a stepped ease and a stagger. CSS has `rule-draw` (`steps(24)`), `.blog-underline` (`steps(8)`), `blink`, `loading-cycle`, `form-flash` and a 0.25 s root fade (`src/styles/theme.css` lines 146 to 157 and 336 to 432). There are no motion tokens: Tailwind `duration-200` appears 73 times and Motion `duration: 0.4` appears 24 times.
- **Design debt that blocks restyling:**
  - Inline `style={{ border, borderRadius, background }}` repeats in `SectionHeader.tsx`, `Terminal/windows.tsx`, `Decorations/_helpers.tsx` and `Footer.tsx`.
  - Font stacks are defined twice with different values (`theme.css` lines 24 to 26, `tailwind.css` lines 7 to 9).
  - Two reduced-motion mechanisms disagree (`theme.css` lines 445 to 457, `index.css` lines 377 to 383).
  - A blanket `[class*="bg-"]` transition (`theme.css` lines 163 to 165).
  - Dead tokens (`--sidebar-*`, `--chart-*`, `--ok`, `--warn`, `--bar-empty`, `--switch-background`) and `.page-grid`, which no component uses.
  - Text at 8 and 9 px (`text-2xs`, `text-3xs`), below a readable floor.
  - Dead code: `.section-reveal` observer (`index.astro` lines 85 to 102), `@/stores/activitySensor` (written, never read), possibly `Decorations/VisitorContext.tsx`.
- **Large files:** `BlogPostIsland.tsx` 696 lines, `ImageLightbox.tsx` 611, `BlogListIsland.tsx` 356, `Nav.tsx` 274, `ProjectsPageIsland.tsx` 273, `SettingsIsland.tsx` 272, `ExperiencePageIsland.tsx` 271. `Hero.tsx` is 158 lines; its split is justified by the hero work, not by size.
- **Blog:** two posts in EN and RU. The reader has a fake pager status line fed by a 200 ms throttled hook, a plain text TOC, a copy button injected by hand-built DOM, no code-block metadata, and a lightbox that only fades. KaTeX CSS loads on every post. The post body has `transition:name="blog-content"` with `slide(0.3s)` in both `[slug].astro` files, and `<main>` has `transition:animate={fade}`.
- **Data sources that exist today:**
  - `/api/github/calendar`, `/api/github/commits` and `/api/github/events` all read one upstream call, `users/<name>/events/public?per_page=100` (see `UPSTREAM_URL` in `commits.ts` and `calendar.ts`). These are GitHub public events (pushes, PRs, comments), capped at 100 events, not commits. `ActivityCalendar` already labels them "event".
  - `scripts/generate-changelog.ts` already runs `git log` at build time, and CI checks out with `fetch-depth: 0`. A build-time per-day commit count is therefore supported. `buildMeta.ts` and `changelog.ts` refresh only in CI or with `BLOG_REFRESH_BUILD_META=1`, so a local build can hold older data than CI (for example `buildMeta.ts` holds an older hash than git HEAD).
  - Blog data carries `wordCount` and the ISO date per post (`scripts/generate-blog-data.ts`).
  - `scripts/generate-og-images.ts` uses `satori` and `@resvg/resvg-js` with static Geist 400 and 500 fonts. `sharp` is also in `package.json`, but plates and covers use `satori` and `resvg` to keep one image stack.
  - Geist Sans is a variable font with weight 100 to 900 (`src/styles/fonts.css`), so the `wght` axis is available now.
- **Gates:** CI hard-fails only on Lighthouse accessibility below 0.9 and CLS above 0.1 (`.lighthouserc.json`); performance, LCP and TBT only warn, desktop preset only. Playwright has no screenshot baselines. Vitest has no DOM environment and requires 70% coverage.

## 3. Design system changes

### 3.1 What stays (identity, not amended)

1. No chromatic accent. `--emphasis` (white on dark, black on light) plus weight and underline. `--destructive` only for destructive actions.
2. Graphite and eggshell dark palette; warm paper and ink light palette.
3. Font roles: Geist Sans for chrome and all headings; Geist Mono for code, terminal output and `.label-meta` only; Piazzolla for blog prose and blog titles only; Geist Pixel for decorative counters.
4. Flat panels: 1px `var(--border)`, 2px radius, no shadow, no pill buttons.
5. No fabricated data. A panel without a real data source does not exist. Generative art must be seeded or driven by real inputs.
6. Content in static HTML. Islands are for interactive chrome. SEO and agent surfaces in `AGENTS.md` are untouched.
7. The numbered `SectionHeader`, field codes, `$` prompts and tree branches, all showing real tool output.
8. Accessibility floor: WCAG AA contrast, 44 px touch targets, focus ring `2px solid var(--emphasis)` at offset 3, reduced-motion support.
9. No Matrix look: no green-on-black, code rain, CRT bezels or scanlines.
10. Scroll-jacking stays banned. Smooth-scroll libraries are rejected.
11. No gradient fills, no noise or grain tile, no shadow, no glow. A feature that needs a luminance mask or a texture must add its own amendment in its own phase.

### 3.2 What is amended (just-in-time)

`DESIGN.md` wins on conflict with `docs/Guidelines.md`. Each rule below is added to `DESIGN.md` and `docs/Guidelines.md` in the same PR as the first code that uses it, not in one batch. This keeps each owner approval small and tied to a visible result. The "Phase" column says where each rule lands.

| Rule | New wording | Phase |
|---|---|---|
| A1. Motion classes | Motion is allowed when it carries state. Permitted: enter reveals (`opacity`, `transform`, `clip-path`); draw-ons for rules, frames and SVG paths; scroll-linked progress and reveals; page and shared-element transitions; text decode on values that change; data-driven chart transitions. Each phase adds only the classes it uses. All other motion stays banned. | 5 (reveals, draw-ons, scroll), 6 (transitions), 8 (decode, field) |
| A2. Scroll effects | Use CSS `animation-timeline` first, behind `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`. The default state is the finished, visible state. | 5 |
| A3. Hover and tap | `whileHover` and `whileTap` may change opacity, background, underline and `outline`. They may not change width, height, margin, position or scale. | 5 |
| A4. Ambient loop | One ambient loop per page: the hero field. It runs at 15 fps at most, at half resolution. It pauses off-screen, on `visibilitychange`, and when battery saver is on where the platform reports it. It has a visible pause control (WCAG 2.2.2) and an `effects` setting. It draws one still frame under reduced motion. Pulse, breathe, float and bounce loops stay banned. | 8 |
| A5. Intro | The hero boot may run at most 900 ms, only on the first home visit in a session. It never delays LCP text, and it is skippable by any key or click. | 8 |
| A6. Pointer (narrow change of "no mouse-follow") | The pointer may displace the dither of the hero field only. It applies only when `(pointer: fine) and (hover: hover)`. It is off on `pointer: coarse`, under reduced motion and when `effects` is not `full`. It never moves layout and is never the only cue. All other mouse-follow, cursor glow and parallax stay banned. | 8 |
| A7. Blur | Nav blur is documented as the single allowed backdrop blur on the public site. The admin SPA has its own `backdrop-blur-sm` (`src/admin/components/AdminLayout.tsx` line 122); the doc names both. | 5 |
| A8. Generative art | Allowed when seeded by real data. Allowed seeds: build-time `git log` day counts, GitHub public events from `/api/github/calendar`, project fields from `projects.json`, and post slug, word count, heading structure and publish date. The caption must name the seed. | 8 (field), 10 (covers, plates) |
| A9. Weights | 400 and 500 for body and chrome, 600 for emphasis, and a variable-weight display moment on the hero name using the `wght` axis. | 8 |
| A10. Pixel font | The cap of 6 per page is dropped. Rule: decorative counters only, never body or labels. | 5 (doc only) |
| A11. Atmosphere budget | Replaced by principle 4: one signature per viewport, never two decorative blocks adjacent. | 5 |

Dropped from the first draft: the gradient amendment and the noise-tile amendment. Nothing in the signature moments uses them, and both sit near the banned grain and scanline look. They return only if a later feature proves a need.

### 3.3 New tokens

All go in one place, `src/styles/tokens.css` (new, imported first in `theme.css`), and are bridged to Tailwind through `@theme inline`.

**Motion durations:**

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 80ms | hover color, focus |
| `--dur-fast` | 150ms | underline, toggle |
| `--dur-base` | 240ms | panel fade, menu |
| `--dur-slow` | 420ms | reveal, draw-on |
| `--dur-scene` | 700ms | hero boot, page transition group |

`--motion-duration-scale` (already set by `settingsStore.ts`) multiplies all of them: `calc(var(--dur-base) * var(--motion-duration-scale, 1))`. This replaces the 73 raw `duration-200` and 24 raw `0.4` uses over the course of the phases.

**Easings:**

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` (quint, matches `src/lib/motion.ts`) |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--ease-step-8` | `steps(8)` (underline) |
| `--ease-step-24` | `steps(24)` (plotter rule) |

The stepped easings stay the brand signature. The same values are exported from `src/lib/motion.ts` for Motion calls, and a unit test asserts the CSS and TS values match.

**Fluid type scale** (Utopia-style, 1.2 ratio at 360 px to 1.25 at 1240 px; values to be generated and checked in Phase 1):

| Token | Role | Range |
|---|---|---|
| `--step--1` | label, caption | 0.8125rem to 0.875rem |
| `--step-0` | UI body | 0.9375rem to 1rem |
| `--step-1` | lede, h3 | 1.125rem to 1.25rem |
| `--step-2` | h2 | 1.35rem to 1.6rem |
| `--step-3` | h1 | 1.65rem to 2.1rem |
| `--step-4` | display-2 | 2rem to 2.9rem |
| `--step-5` | display-1 (secondary hero lines) | 2.75rem to 5.25rem |
| `--step-6` | hero name (Phase 8; may exceed `--step-5`, set after the Phase 8.1 layout test) | to be set |

Every preferred value contains a `rem` term so browser zoom works. The 8, 9 and 10 px custom sizes are removed; `.label-meta` becomes 11 px minimum on mobile and 12 px on desktop, and the visitor font-size setting still scales it.

**Grid:**

| Token | Value |
|---|---|
| `--grid-cols` | 12 |
| `--grid-gap` | `clamp(1rem, 0.5rem + 1.5vw, 1.5rem)` |
| `--grid-max` | 1240px (was 1160px) |
| `--grid-pad` | `clamp(1.25rem, 2vw + 0.5rem, 3rem)` |
| `--grid-line` | `var(--border)` at the column edges |
| `--mark-size` | 7px (crosshair registration marks) |

`.page-grid` is revived as the single layout primitive (it is unused today) and carries named lines `full`, `wide`, `content`, `margin`, so the blog can place a margin column and figures can break out.

The width change from 1160 px to 1240 px has a different effect per page, and each is checked in Phase 5: the home page and `/projects` gain 80 px; the blog list rows gain 80 px of row width; the blog post keeps its 46rem prose measure and only the figure and margin lines change; `/experience`, `/settings`, `/privacy` and `/changelog` follow the home rule unless the Phase 5 screenshots show a worse line length. The owner approved 1240 px (section 10, decision 5).

**Cleanup in the same files:** one font-stack definition, the dead shadcn families deleted after an AST check, `theme-color` values read from tokens instead of hardcoded in `BaseHead.astro` lines 43 and 44 and `ThemeScript.astro` lines 35 and 64.

## 4. Signature moments

Ten features. Each lists what the visitor sees, technique and library, code location, cost, and the reduced-motion fallback. The four hero-level pieces are S1 (name and field), S9 (generative cover), S10 (architecture diagram) and the pointer response inside S1. Costs are estimates to be replaced by Phase 0 measurements; the hard limits are in the section 8 budget table.

### S1. Hero: name-as-dither over a real-data field

- **Sees:** a very large name set in Geist Sans with a variable weight (the `wght` axis, for example 300 at rest and 650 on the emphasised letters). The name is the real `h1` text, selectable and readable at once. Behind it, a canvas draws a Bayer-dithered echo of the name through a glyph mask. Around it, a slow dithered field fills the hero, graphite on eggshell in light mode and eggshell on graphite in dark. Dither density follows real data: the build-time `git log` commit counts per day for the last 13 weeks, mapped from left (oldest week) to right (newest). A one-line mono caption names the seed: `FIELD: 13 weeks of commits to po4yka/blog, built <hash>`. If the seed array is empty, the field falls back to a flat low density and the caption says `FIELD: no data`. Hairline frames draw in (plotter steps), the whois window types its field-code rows, and values that changed (counts, dates) decode once. On a fine pointer, the cursor displaces the dither near it (see A6). A visible `pause field` control stops the loop.
- **Data seed (decision):** the seed is a small generated array of 91 day counts from `git log`, written by a new generator step into a generated file (for example `src/data/fieldSeed.ts`). It joins `generate:all` and `validate:all`, and the protect-generated hook list is extended to cover it. The build poster and the runtime canvas read the same array, so they cannot disagree. It refreshes under the same rule as `buildMeta.ts` (CI or `BLOG_REFRESH_BUILD_META=1`); a local build may hold older data than CI, and the caption shows the build hash so this is visible. The GitHub public events from `/api/github/calendar` stay in the activity panel, where they are captioned "public GitHub events". They are not the hero seed: they are capped at 100 events, they saturate for an active account, and they would make the poster and canvas differ.
- **Technique:**
  - One pure TypeScript function, `ditherField(params): Uint8Array`, in `src/lib/dither.ts`. It takes the day counts, the glyph mask, the size, the time step and the pointer point, and returns a 1-bit buffer using a fixed Bayer matrix. It has no DOM access and has unit tests (matrix values, determinism for a fixed seed, density monotonic in count, pointer displacement bounded).
  - The build script `scripts/generate-field-poster.ts` calls the same function in Node and writes the poster with `satori` and `resvg` as a low-priority CSS background. The runtime path calls the same function and paints with Canvas 2D `ImageData` at half resolution, scaled up with `image-rendering: pixelated`. There is no WebGL, no shader and no `ogl`. Canvas 2D has no context-loss handling, and DPR is capped at 1.
  - The glyph mask comes from drawing the name once on an offscreen canvas after `document.fonts.ready`, using the same `wght` as the CSS. The result is cached per size.
  - Text and frames use CSS `@starting-style`, `clip-path` and the existing `rule-draw`, with no Motion needed.
  - The loop is capped at 15 fps with a time accumulator inside `requestAnimationFrame`.
  - Pointer response: one `pointermove` listener, coalesced to the next frame, enabled only when `(pointer: fine) and (hover: hover)` matches.
- **LCP:** the `h1` is the LCP element. The poster is a CSS background with low fetch priority and loads after the text; the canvas starts on `requestIdleCallback` after first paint. The Phase 0 and Phase 8 checks assert the Lighthouse `largest-contentful-paint-element` audit names the `h1`.
- **Library:** none.
- **Where:** `src/components/Hero.tsx` (split into `HeroText`, `HeroWhois`, `HeroStrip`), new `src/components/Hero/DitherField.tsx` (client:idle island), new `src/lib/dither.ts`, new `scripts/generate-field-poster.ts` and the field seed generator, wired into `generate:all`.
- **Cost:** about 3 to 6 KB gzip lazy JS plus a poster under 20 KB. No eager JS added. Canvas size is reserved with `aspect-ratio`, so CLS stays 0.
- **Reduced motion and fallbacks:** poster and name mask only, no loop, no boot, no pointer, decode skipped. The same state applies when `effects` is `reduced` or `off` (off also removes the poster), when `navigator.connection.saveData` is true, and when the canvas is off-screen. The `pause field` control is a real `<button>` with `aria-pressed`, a 44 px target and a visible label.
- **Contrast:** the dither sits behind the live text. Text contrast against the worst-case dithered pixel is measured (AA, 3:1 for large text) with an axe or `accesslint` pass on the hero in both themes.
- **RU:** the name is the same in both locales, but the caption, the control labels and the whois rows are checked in Russian for width at 375 px.

### S2. Visible grid, registration marks and scroll-drawn rules

- **Sees:** faint 1px column hairlines and small crosshair marks at section corners, as in the Geist system, so the 12-column grid is visible and panels snap to it. Section rules draw as the section enters. A thin reading position rail runs along the page edge.
- **Technique:** CSS only. Grid lines are a `background` of repeating hairlines on `.page-grid::before`, hidden in print. Marks are SVG data URIs. Rule draws use `animation-timeline: view()` with `animation-range: entry 0% entry 60%`, replacing the per-component `useInView` plus `motion.div` pairs. Fallback for browsers without support: rules are simply drawn. Registration marks are checked against the "one signature per viewport" rule in the Phase 5 screenshots; if they compete with the hero, they are dropped from the hero viewport.
- **Library:** none.
- **Where:** `src/styles/tokens.css`, new `src/styles/scroll.css`, `src/components/SectionHeader.tsx` (remove `useInView` rule animation), `Terminal/windows.tsx` (`DrawnRule`).
- **Cost:** 0 KB JS. It removes the `useInView` observer from most islands.
- **Reduced motion:** wrapped in `no-preference`; the grid and marks are static and stay.
- **Forced colors and print:** under `forced-colors: active` the hairlines use system colors or are hidden on purpose; print hides guides and marks. Both are checked.

### S3. Page transitions

- **Sees:** navigating from the blog list to a post morphs the list title into the post `h1`. The post body keeps its slide. Other navigations keep the short root crossfade. The theme change keeps the simple fade (see below).
- **Technique:** the site already uses `ClientRouter` and `document.startViewTransition` (`Nav.tsx` lines 90 to 95). The Astro `transition:name` directive does nothing inside a React island, so the shared title uses an inline `style={{ viewTransitionName: \`title-${slug}\` }}` on the title element in `BlogListIsland.tsx` and in `BlogPostIsland.tsx`. Names are unique per page (one per slug) and must exist on both pages when the browser takes the snapshot, so the list renders the name only on its own rows and the post renders it only on its own `h1`.
- **Coexistence with the existing transitions:** the post body keeps `transition:name="blog-content"` with `slide(0.3s)`, and `<main>` keeps `transition:animate={fade}`. The title morph is a separate named group, so it runs in parallel with the body slide and the main fade. The Phase 6 spec records one trace of a list-to-post navigation and checks that the three groups (title, body, main) all run and finish in 300 ms. If the main fade hides the title morph, the main fade is removed for the list-to-post route only.
- **Only two posts exist today,** so the morph is shown on two rows. It is accepted as a small proof; the value grows with the blog.
- **Theme change (decision):** the circular wipe comes back (section 10, decision 4). It was removed in commit `a0146f7` ("pivot to swiss + operator-console visual system"), and the `theme.css` comment at line 146 reads "simple fade, no radial clip theatre"; that comment is updated in the same PR. The simple fade stays as the reduced-motion and `effects: reduced/off` path.
- **Library:** none (Astro plus the platform). Stay on `ClientRouter` (native cross-document transitions cannot persist islands).
- **Where:** `src/styles/theme.css` lines 146 to 157 (move to new `src/styles/transitions.css`), `BlogListIsland.tsx`, `BlogPostIsland.tsx`, `src/layouts/MainLayout.astro`.
- **Cost:** 0 KB, under 40 lines of CSS and 10 lines of TS. Keep each transition under 300 ms to protect INP.
- **Reduced motion:** Astro already disables transitions under the OS flag; the stored `reduceMotion` gate in `Nav.tsx` line 96 stays. Add an e2e check for both.

### S4. Blog reading experience

- **Sees:** a 1px progress rail driven by scroll, replacing the throttled "42%" pager text (the text can stay as a label fed by the same value). A nested TOC with a per-section progress mark and a mobile bottom sheet. Code blocks with language label, filename, line numbers, line highlight and diff. Footnotes as margin notes on wide screens and a popover on narrow ones. Heading anchors that are always visible on touch. KaTeX CSS only on posts with math. Optional, last: a lightbox that expands from the inline image.
- **Technique:**
  - Progress rail: `animation-timeline: scroll(root)` on a `transform: scaleX` element; a 12-line JS fallback only under `@supports not`.
  - TOC: heading tree built at build time by a rehype plugin and passed as a prop; scroll-spy tracks the heading whose section occupies the viewport range, not only the top heading.
  - Code: `@shikijs/transformers` (notation highlight, notation diff, line numbers) plus a small transformer for language and filename. The copy button becomes a rendered element with a delegated click handler, replacing the imperative DOM in `CodeBlockCopy`.
  - Footnotes: one DOM node per footnote, not a copy. A rehype step keeps the standard footnote output and CSS places each note in the margin column at `lg` (grid placement, or anchor positioning where supported). Below `lg`, the same node opens as a `popover`. The `#fn` link stays as the no-JS path. No text is duplicated, so screen readers and crawlers see each note once.
  - KaTeX: a CSS import in Astro frontmatter is hoisted for the whole page template and cannot be conditional. Instead, the math stylesheet is a `<link>` rendered by a small component that `[slug].astro` includes only when the rendered HTML contains `.katex` (or a frontmatter flag is set). Check it against the havamal-synced MDX before relying on it.
  - Lightbox (optional): View Transitions API shared-element expansion using a temporary `view-transition-name` on the clicked image. It starts only after the blog split (Phase 4) and only through the extracted `Lightbox` seam. `ImageLightbox.tsx` is 611 lines with pan, zoom, deep links and swipe, so this is the highest-effort, lowest-value item in S4 and is last.
- **Library:** `@shikijs/transformers` (build-time, no runtime cost). No other new library.
- **Where:** the split from Phase 4 comes first. Then `src/components/blog/` modules, `astro.config.mjs` (Shiki and rehype config), `src/lib/shiki-mono.ts`, `src/pages/blog/[slug].astro`, `src/pages/blog/ru/[slug].astro`, `src/styles/index.css` lines 128 to 160 and 268 to 292.
- **Cost:** about 1 to 2 KB runtime JS for the TOC and footnote popover; transformers add build time only. The progress rail removes the throttled hook from the hot scroll path.
- **Reduced motion:** the rail still shows position (it is state, not decoration) but without easing; the lightbox expansion becomes an instant open; the TOC mark has no transition.
- **Contracts to keep:** `<article>` > `<header>` > `<h1>` + `<time dateTime>`, the "resume at N%" feature, `?fig=N` deep links, and the roles and names in `e2e/blog.spec.ts` and `e2e/blog-lightbox.spec.ts`. The havamal sync must be checked because it writes the MDX.
- **Browsers:** scroll timelines and view transitions are tested in Chromium, WebKit and Firefox (section 7, Phase 0); the finished-state fallback is checked in each.

### S5. Project plates and spec sheets

- **Sees:** each project row on `/` and `/projects` gets a small 1-bit "plate" at the left: a deterministic dithered mark. On hover the plate's dither density rises (opacity and background-position only) and the row prints its stack as a tiny spec sheet (`STACK`, `PLATFORMS`, `REPO`), taken from `projects.json`, which already has `platforms`, `tags`, `links` and `slug`. Where a project has a real screenshot or icon in the repo, the plate is that image run through the build-time dither; otherwise it is a glyph pattern seeded by the slug hash and captioned as an identity mark, never as a metric.
- **Technique:** `scripts/generate-plates.ts` (build time) calls the shared `ditherField` function from `src/lib/dither.ts` (the one used by S1), with an error-diffusion or ordered mode, and rasterises with `satori` and `@resvg/resvg-js` as 1-bit PNGs or SVGs into `public/plates/`. No second image stack and no `sharp` call. The row markup stays a static list; the hover is CSS only.
- **Library:** none new.
- **Where:** `src/components/Projects.tsx`, `ProjectsPageIsland.tsx`, new `scripts/generate-plates.ts`, `package.json` (`generate:all`), `src/__tests__/dither.test.ts` (shared with S1).
- **Cost:** 0 KB runtime JS; plates are small static images (target under 3 KB each).
- **Reduced motion:** the hover is a state change, so it stays as an opacity change without animation.

### S6. Terminal upgrade: command palette and visible shell

- **Sees:** `Cmd+K` (or `/`, or a visible button in the nav) opens a palette that searches pages, posts (from `blogMeta`), projects, theme, language, "copy email" and "jump to section". The footer shell and the palette share one command registry, so every palette action is also a typed command. The palette is the differentiator, not its look: commands are shaped like `git log` and shell verbs (`git log --posts`, `ls projects`, `cat about`, `open <slug>`, `theme dark`), and results show real fields such as the date, the commit hash of the last change and the word count. A small mono hint under the hero (`press / for the shell`) makes the terminal visible without scrolling. The StatusLine becomes usable on mobile as a collapsed one-line bar that opens a bottom sheet.
- **Technique:** the palette island is loaded on first trigger with dynamic `import()`, with a prefetch on idle after first interaction. Focus trap, combobox and listbox roles, live result count, `Esc` and a visible opener button are checked by Playwright.
- **Library:** `cmdk` only if a spike passes the focus, role and live-region checks above and the size measurement. Otherwise a small combobox on the existing `@radix-ui/react-dialog`. The 8 to 12 KB figure is unmeasured.
- **Where:** new `src/components/CommandPalette/`, `src/components/Terminal/commands/` (extract the registry used by `Footer.tsx` into `src/lib/commands.ts`), `KeyboardShortcuts.tsx` (add `Cmd+K`), `Nav.tsx` (button), `StatusLine.tsx` (mobile).
- **Cost:** glue plus the combobox, estimated at 5 to 12 KB gzip, lazy, 0 KB eager except a 300-byte trigger.
- **Reduced motion:** open and close are opacity only.
- **Data rule:** results come from `blogMeta`, `projectsData` and routes only. No invented commands.

### S7. Decode on changing values, and live numbers

- **Sees:** values that change decode from mono glyphs into their final text once, as they arrive: counts, dates, the build hash and the field caption numbers. Section numbers do not decode (they carry no state and are the generic version of this effect). Counters count up smoothly.
- **Technique:** one `decode()` utility (about 30 lines, `requestAnimationFrame`, reads the settings store) used through a `data-decode` attribute and one delegated observer, so islands do not each carry the logic. The final text is in the HTML and in `aria-label`. `AnimatedNumber` is rewritten with a Motion value and `animate()`, removing the per-frame `setState` at `AnimatedNumber.tsx` line 32.
- **Library:** none new. Use Motion `ScrambleText` instead of the custom utility only if Motion 13 ships it and the license allows it (to be verified in Phase 0; `node_modules` was not present when this plan was written).
- **Where:** new `src/lib/decode.ts`, `AnimatedNumber.tsx`, `_animatedNumber.utils.tsx`, the hero whois and strip.
- **Cost:** under 1 KB.
- **Reduced motion:** no decode; final text immediately.
- **RU:** decode widths are checked with Cyrillic strings; the decode glyph set is mono Latin and digits only, and the container width is fixed from the final string.

### S8. Data panels with real SVG

- **Sees:** the contribution heatmap grows from 11 px to a readable cell size with a scrubbing readout (date and count on hover and on keyboard focus). It is captioned "public GitHub events", because that is what the endpoint returns. The 14-day sparkline becomes an SVG path that draws, with the latest value labelled. The experience page gets a proper timeline rail instead of a list.
- **Technique:** SVG with `pathLength` draw-on (Motion or CSS), cells as a single `<svg>` with `<rect>` and `role="img"` plus a visually hidden table of values. Data stays on the existing `/api/github/calendar` and `/api/github/events` endpoints and `experience.json`. Reserve height before data arrives, so there is no pop-in (today the section returns `null` and then inserts; see `ActivityCalendar.tsx` and `OpenSourcePanel.tsx`).
- **Library:** none new.
- **Where:** `src/components/Decorations/ActivityCalendar.tsx`, `ActivitySparkline.tsx`, `ExperiencePageIsland.tsx`; replace the 91-cell `staggerChildren: 0.002` with a CSS animation delay by column.
- **Cost:** 0 KB new; removes the per-cell Motion nodes.
- **Reduced motion:** final state at once; the readout still works.

### S9. Per-post generative cover and OG card

- **Sees:** each blog post gets a distinct 1-bit generative cover. Its structure comes from the post: the slug hash sets the base pattern, the word count sets the overall density, the heading count and depth set the number and size of bands, and the publish date sets the phase offset. Two posts never look alike, and the same post always looks the same. The cover shows in the post header and is reused as the base of the post's OG image, replacing the generic OG output. A mono caption under the cover names the inputs (`COVER: slug, 1840 words, 9 headings, 2026-04-01`).
- **Technique:** a build-time step in the existing OG pipeline. The heading structure is parsed from the MDX body in `scripts/generate-blog-data.ts` (word count and the ISO date already exist there). The shared `ditherField` function from `src/lib/dither.ts` renders the 1-bit buffer; `satori` composes the card and `@resvg/resvg-js` rasterises it, as `scripts/generate-og-images.ts` does today. The Phase 10 step checks whether the generator writes one image per language and keeps that rule (word counts differ between EN and RU, so the cover seed uses the EN metadata for both unless the current output is already per language). Cyrillic titles need glyph support; the generator currently loads static Latin Geist files, so the RU path is checked first.
- **Library:** none new (`satori` and `resvg` are in `package.json`).
- **Where:** `scripts/generate-og-images.ts`, `scripts/generate-blog-data.ts`, `src/lib/dither.ts`, `BlogPostIsland.tsx` (header), `BaseHead.astro` (unchanged contract: `og:image` per post).
- **Cost:** 0 KB runtime JS. The cover is a small static PNG (target under 10 KB at 1-bit), and the OG PNG stays within the current size range.
- **Reduced motion:** static image, no motion.

### S10. Site architecture diagram

- **Sees:** on `/about` or the colophon area of the footer, an inline SVG diagram of the site itself: browser, Cloudflare edge and Workers, Astro (prerendered pages and server routes), D1, and the GitHub API. Strokes draw along the real request paths once when the diagram enters the viewport: a static page request, an API request (`/api/github/*` through Workers to GitHub, with the 10-minute cache from `commits.ts`), and an admin request (Workers to D1). Labels use real names from the repo (route patterns, `env.DB`, `CACHE_TTL_S`). No latency, throughput or uptime numbers are shown, because no real source for them exists.
- **Technique:** inline SVG in static HTML, `stroke-dasharray` and `stroke-dashoffset` draws in CSS, scroll-triggered with `animation-timeline: view()` and a finished-state fallback. No JS.
- **Library:** none.
- **Where:** a new `src/components/Architecture.astro`, the page that hosts it, `src/styles/scroll.css`.
- **Cost:** 0 KB JS, under 4 KB of markup.
- **Reduced motion:** the diagram is drawn at once. It is approved, but it is the first piece to cut if it breaks its budget; dropping it affects no other phase.

## 5. Dependency decisions

| Dependency | Decision | Why | Estimated cost | Alternatives rejected |
|---|---|---|---|---|
| `cmdk` | Conditional | Add only if the Phase 9 spike passes the focus, role and live-region checks and the size is measured. Otherwise build a small combobox on the installed `@radix-ui/react-dialog`; the footer shell already has a command registry to extract | about 8 to 12 KB gzip, lazy, unmeasured | `kbar` (heavier action model than needed) |
| `@shikijs/transformers` | Add (dev, build time) | Shiki already runs with custom monochrome themes; transformers give line numbers, highlight and diff with no runtime | 0 KB runtime | `astro-expressive-code` (a second highlighter, would need the monochrome theme ported) |
| `ogl` / raw WebGL | Do not add; deferred option | The hero uses Canvas 2D with a shared TypeScript Bayer function. Reconsider WebGL only if a measured frame budget on a mid-range Android phone fails | `ogl` would be about 29 to 33 KB gzip before tree-shaking | `three` (140+ KB); `regl` (stagnant); WebGPU (no gain for 2D) |
| Motion 13 | Keep; reduce | Move islands to `LazyMotion` with `m` and `domAnimation`; drop Motion from static islands entirely | saves up to about 20 KB gzip on islands that only fade | `gsap` (second engine, SplitText needs DOM surgery and re-split after font load) |
| `gsap` | Reject for now | Motion plus CSS covers every moment above | 23 KB core plus plugins | |
| `lenis` | Reject | Smooth scroll breaks anchors, scroll-snap, nested scrollers and native scroll-driven CSS | | |
| `sharp` | Not used for plates or covers | It is already in `package.json`, but the OG pipeline uses `satori` and `@resvg/resvg-js`. Using them keeps one image stack | | `jimp` (slower) |
| `tw-animate-css` | Keep unless every consumer is replaced | It is used by `dialog.tsx`, `ImageLightbox`, `Terminal` and others, so removal is unlikely. Remove only after `rg` shows no `animate-in`, `fade-in` or `slide-in` use left | saves a small CSS import | |
| `web-vitals` or the existing analytics host | Owner decision (see Phase 0) | Lab Lighthouse cannot verify field INP and LCP | about 2 KB if added | |
| `@lhci/cli` mobile run | Config change, not a package | Add a mobile preset URL list so mobile performance has a gate | CI time | |

All size figures in this table are estimates until Phase 0 measures them. No dependency is added to the eager bundle. Every new runtime piece loads behind `client:visible`, `client:idle` or a dynamic `import()`.

## 6. Refactoring prerequisites

Do these before visual work. Each is behavior-preserving and verified by the existing e2e suite. They map to Phases 1 to 4.

1. **Consolidate tokens** (`src/styles/theme.css`, `tailwind.css`, `fonts.css`, `index.css`):
   - One font-stack definition; remove `--font-family-sans` and `--font-family-mono` (Tailwind 4 reads `--font-sans`); add `--font-pixel` to `@theme` so a `font-pixel` utility exists.
   - Delete dead token families after an AST/`rg` pass: `--sidebar-*`, `--chart-*`, `--ok`, `--warn`, `--bar-empty`, `--switch-background`. Do not delete `--popover*` (used).
   - Replace the blanket `[class*="bg-"]` transition (`theme.css` lines 163 to 165) with an explicit class on the elements that need it.
   - Unify reduced motion into one mechanism: a single `:root[data-motion="reduce"]` attribute set by `ThemeScript.astro` from either the OS query or the stored flag, plus the CSS `@media` as a no-JS fallback. Remove the `@property --animation-reduced` trick. Both paths must shorten transitions as well as animations.
   - Remove 8, 9 and 10 px custom sizes (`tailwind.css` lines 12 to 18) and migrate their users (`Projects.tsx`, `BlogListIsland.tsx`, `SectionHeader.tsx` and others found by `rg`).
   - Fix the doc and code drift listed in the design-system map (section numbers 06 or 07 in `BlogPreview.tsx`, `BlogListIsland.tsx` and `scripts/generate-og-images.ts` line 38; the stale "Astro 6" comment in `BlogFigure.astro`).
2. **`Panel` primitive:** one `src/components/ui/Panel.tsx` (or a `.panel` CSS class) that owns border, radius and background. Replace the repeated inline `style` objects in `SectionHeader.tsx`, `Terminal/windows.tsx`, `Decorations/_helpers.tsx` and `Footer.tsx`. Rename `MacWindow` (it is no longer a window) and remove `Accent` ("kept for source compatibility", `Terminal/ui.tsx`). The project forbids compat shims, so the PR lists every call site of both and updates each one.
3. **Motion primitives module:** extend `src/lib/motion.ts` to export the new durations and easings. Add `Reveal` (CSS-first, `data-reveal`) so components stop re-implementing `initial={{ opacity: 0 }} animate={inView ? ... }`. `Reveal` MUST work without `scroll.css`: its default is an `@starting-style` entrance, which is final-state by default and needs no JS or scroll timeline. Phase 5 may upgrade `Reveal` to scroll-linked timelines behind `@supports`. After migration, delete `useInView` users that only drive fades. The `decode()` helper is added later, with S7.
4. **Strip Motion from static islands:** `Projects.tsx`, `Experience.tsx`, `BlogPreview.tsx` and `Links.tsx` use React only for `useLocale()`. Remove their `MotionProvider` and Motion imports and use CSS reveal. Only `Hero`, `Nav`, `Footer` and the data panels keep Motion. The owner chose to go further: these four become Astro components in Phase 3 (section 10, decision 3).
5. **Delete dead code** (verify each with `rg` over the whole repo first): the `.section-reveal` observer (`index.astro` lines 85 to 102), `@/stores/activitySensor` and `activityStore`, `Decorations/VisitorContext.tsx`. `.page-grid` stays because Phase 5 revives it.
6. **Split large islands:**
   - `BlogPostIsland.tsx` into `useResumePosition`, `useHeadings`, `Toc`, `MobileJumpNav`, `CodeBlockCopy`, `CopyLinkButton`, `CopyMarkdownButton`, `PostHeader`, `PostFooter`, `PostPager` under `src/components/blog/`.
   - `ImageLightbox.tsx` into variant-picking utilities (lines 37 to 135, pure and unit-testable), figure registry, dialog chrome, and pan/zoom, behind a `Lightbox` seam.
   - `BlogListIsland.tsx` into `PostRow` (shared with `BlogPreview.tsx`), `Filters`, `BlogStats`.
   - `Hero.tsx` into `HeroText`, `HeroWhois`, `HeroStrip`. This is done in Phase 8.1 with the hero work, not as a separate refactor.
7. **Fix layout shift at the source:** data sections that return `null` until fetched (`RealGitLog.tsx`, `OpenSourcePanel.tsx`, `ActivityCalendar.tsx`) reserve height with a skeleton frame of fixed `min-height`. The `:has(> astro-island:empty)` hiding rule is removed once heights are reserved. Align `ActivityCalendar` on `deferIdle` like the sparkline, and use `GITHUB_USERNAME` from `@/lib/constants` instead of the hardcoded `GH_USER` in `ActivitySparkline.tsx` line 10.
8. **Test scaffolding:** see Phase 0. Add Playwright screenshot baselines and a mobile Lighthouse run. Without these a visual redesign has no regression net.

## 7. Phased implementation

Each phase is one small PR where feasible (target under about 400 changed lines; generated and deleted lines do not count). Order matters: every phase leaves the site shippable. No phase merges to `main` without owner approval, because CI deploys `main` to production.

**Sequencing of approvals:** all owner decisions are resolved (section 10). Each later phase lands its own rule amendment (section 3.2) in the same PR.

**Standard verification for every phase unless noted:** `npx vitest run <affected file>`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e` for affected specs, a visual check at 375 px and 1280 px in light and dark, a Russian-locale check of every new or changed string at 375 px, and a reduced-motion check with the OS flag and with the in-site toggle separately. Report each check with command, exit code and log path.

**Acceptance gate for "stunning":** each phase that adds a visible effect (Phases 5, 6, 7, 8, 9, 10, 11) attaches a before and after screen recording (desktop and a phone-size viewport) to its PR. The owner reviews the recording and approves it as part of the phase gate. A phase whose recording does not look clearly better does not merge, even when all automated checks pass.

**Rule-change step:** every phase that edits `DESIGN.md` or `docs/Guidelines.md` ends with `bash scripts/apply-skill-policy.sh` and `npm run validate:skills`, and commits the result, because the pre-commit `validate:skills` check fails until this is done.

### Phase 0: Baseline and test scaffolding (no site code change)

- **Scope:** measure and record the starting point. Production build JS per route (home, `/blog/`, one post, `/projects/`), Lighthouse desktop and mobile for those four URLs, and a record of which element Lighthouse reports as LCP on each. Verify the open facts: Motion 13 `ScrambleText` availability and license; `tw-animate-css` consumers; `VisitorContext` consumers; the CSP path (see section 8, platform constraints); whether the existing analytics host can record field LCP and INP, or whether `web-vitals` is needed (owner decision, field data is the only proof of the budgets).
- **Playwright setup:**
  - Screenshot baselines (home, blog list, one post, projects, 404; light and dark; 375 px and 1280 px) are generated only in the CI container (Linux, a pinned Playwright image), never on a developer Mac.
  - Tests freeze any canvas with a `?still` flag or a seeded static frame, mask dynamic regions (build hash, dates, GitHub panels), and use a small pixel-difference threshold.
  - Add WebKit and Firefox projects for the scroll-timeline and transition specs.
  - Add a mobile Lighthouse preset to `.lighthouserc.json`.
- **Real-device plan:** list the devices the owner can test on (an iPhone with Low Power Mode, a mid-range Android phone). Set the budget in section 8 for frame time and battery. Record the device results by hand in the PR, because emulated Lighthouse cannot measure them.
- **Files:** a short measurement note in `docs/redesign/baseline.md` (a measurement table is a gate for the budgets below, not a process artifact), `playwright.config.ts`, `.lighthouserc.json`, CI workflow.
- **Acceptance:** numbers recorded for LCP, LCP element, CLS, TBT and JS bytes per route; the open facts answered; baselines generated in CI and checked in.
- **Result (2026-10-30):** see `docs/redesign/baseline.md`. Two findings change later phases: the LCP element is never the `h1` (the hero intro paragraph on `/`), and mobile LCP is 6.3 to 7.5 s on `/blog/`, `/projects/` and the post because island content ships with `opacity:0` until hydration.

### Phase 1: Token consolidation

- **Scope:** refactor item 1 and the new tokens file with fluid type, motion and grid tokens (no visual redesign yet; map existing values to the new tokens so the page looks the same).
- **Files:** `src/styles/{tokens.css (new),theme.css,tailwind.css,index.css,fonts.css}`, `BaseHead.astro`, `ThemeScript.astro`, users of the removed sizes.
- **Acceptance:** screenshot diff against Phase 0 shows no change beyond text under 11 px that was raised; `e2e/theme.spec.ts` passes; a unit test asserts CSS and TS motion tokens match; admin SPA checked in a browser because `theme.css` is shared.

### Phase 2: Panel, motion primitives and dead code

- **Scope:** refactor items 2, 3 and 5. Introduce `Panel`, extend `src/lib/motion.ts`, add `Reveal` with an `@starting-style` default, delete dead code, list and update all call sites of `MacWindow` and `Accent`.
- **Files:** `src/components/ui/Panel.tsx`, `Reveal`, `SectionHeader.tsx`, `Terminal/windows.tsx`, `Terminal/ui.tsx`, `Decorations/_helpers.tsx`, `Footer.tsx`, `src/lib/motion.ts`, `index.astro`, stores.
- **Acceptance:** `rg "section-reveal|activityStore|activitySensor|MacWindow|Accent"` returns nothing stale; no inline `border: "1px solid var(--border)"` left in `src/components`; `Reveal` shows content in its final state with `scroll.css` absent and with JS disabled; `e2e/public-pages.spec.ts` and `navigation.spec.ts` green.

### Phase 3: Lighter islands and stable layout

- **Scope:** refactor items 4 and 7, plus decision 3 in section 10. Convert `Projects`, `Experience`, `BlogPreview` and `Links` to Astro components with no client JS, `LazyMotion` where Motion stays, reserve heights for data panels.
- **Sub-phases:** 3.1 static language output for the converted sections (EN and RU markup chosen by the pre-paint `lang` attribute, or locale routes; decide by HTML size); 3.2 convert the four sections; 3.3 `LazyMotion` and reserved heights.
- **Files:** `Projects.tsx`, `Experience.tsx`, `BlogPreview.tsx`, `Links.tsx` (replaced by `.astro`), `MotionProvider.tsx`, `RealGitLog.tsx`, `OpenSourcePanel.tsx`, `ActivityCalendar.tsx`, `ActivitySparkline.tsx`, `index.astro`, the language switcher and head script.
- **Acceptance:** no React or Motion chunk for the four sections; home eager JS is lower than the Phase 0 number; CLS on `/` is 0 with the network throttled; the language switch works without a reload and without a flash of the wrong language; `e2e/hydration.spec.ts` and the language e2e tests green; `[data-section-name]` selectors still work.

### Phase 4: Split the blog islands

- **Scope:** refactor item 6 for `BlogPostIsland.tsx`, `ImageLightbox.tsx` (with the `Lightbox` seam) and `BlogListIsland.tsx`, with `PostRow` shared by the home preview. No behavior change. This phase comes before any phase that edits these files.
- **Files:** `src/components/blog/*`, `src/components/ImageLightbox/*`.
- **Acceptance:** `e2e/blog.spec.ts`, `blog-lightbox.spec.ts`, `hydration.spec.ts` green; unit tests for the extracted pure functions (variant picking, heading tree); the JSON-LD and `<article>` structure unchanged (checked by `rg` plus a Playwright DOM assertion). This phase may be two PRs.

Phases 0 to 4 are refactor and measurement only.

### Phase 5: Rules batch 1, grid, marks and scroll-drawn rules (S2)

- **Scope:** amend rules A1 (reveal, draw-on and scroll classes only), A2, A3, A7, A10 and A11 in `DESIGN.md` and `docs/Guidelines.md`, and fix doc drift (nav glass, section-number lists, `.page-grid` padding, reduced-motion claim, the `theme.css` header comment). Then revive `.page-grid` with named lines, add hairline column guides and registration marks, move rule draws to `animation-timeline: view()`, upgrade `Reveal` to scroll-linked timelines behind `@supports`. Apply the content width decision for each page (section 3.3). Run `apply-skill-policy.sh`.
- **Files:** `DESIGN.md`, `docs/Guidelines.md`, `tokens.css`, `scroll.css` (new), `MainLayout.astro`, `SectionHeader.tsx`, `Terminal/windows.tsx`, `src/styles/theme.css` (comment).
- **Acceptance:** owner approves the amended rules and the before and after recording; `npm run validate:skills` passes; no horizontal scroll at 320 and 375 px; in a browser without scroll timelines all rules are visible (checked in WebKit and Firefox projects); `forced-colors` and print checked; `e2e/math-rendering.spec.ts` still passes (overflow check).

### Phase 6: Page transitions (S3)

- **Scope:** shared title morph from list to post with inline `viewTransitionName`, coexistence with the `blog-content` slide and the main fade, `transitions.css` split. The theme fade stays as it is.
- **Files:** `transitions.css` (new), `theme.css`, `BlogListIsland.tsx`, `BlogPostIsland.tsx`, `MainLayout.astro`, rule A1 (transitions) in `DESIGN.md`.
- **Acceptance:** `e2e/theme.spec.ts` and `navigation.spec.ts` green; persisted islands do not remount (check by DOM identity in a Playwright step); no transition runs with the OS flag or the stored flag; each transition under 300 ms by trace; one trace shows the title, body and main groups together; behavior in WebKit and Firefox is checked and the fallback (plain navigation) is verified.

### Phase 7: Reading experience (S4)

Four numbered sub-phases, each its own PR with its own checks.

- **7.1 Progress rail and TOC:** progress rail, TOC rework with build-time heading tree and scroll-spy, always-visible touch anchors. Check: new e2e for TOC jump; the rail follows scroll in Chromium and the JS fallback works in a browser without `animation-timeline`; no horizontal overflow at 375 px.
- **7.2 Code blocks:** Shiki transformers, language and filename label, rendered copy button with a delegated handler. Check: e2e for the copy button; `tabindex` on scrollable code; `llms-full.txt` and the `.md` endpoints still produce clean text.
- **7.3 Footnotes and KaTeX:** single-node footnotes placed in the margin or opened as a popover; conditional math stylesheet through a `<link>` component. Check: e2e for the popover with `Esc` and focus return; each footnote appears once in the DOM; `e2e/math-rendering.spec.ts` green; a havamal sync dry run still produces valid MDX (ask the owner before running the sync); test `content-visibility: auto` on `h2` and `pre` against TOC jumps and scroll-driven effects, and remove it if it misbehaves.
- **7.4 Shared-element lightbox (optional):** only after Phase 4 and only through the `Lightbox` seam. Check: `blog-lightbox.spec.ts` green, `?fig=N` deep links still work, pan, zoom and swipe unchanged.
- **Files:** `src/components/blog/*`, `astro.config.mjs`, `src/lib/shiki-mono.ts`, a new rehype plugin under `src/lib/`, `[slug].astro` (EN and RU), `index.css`, `package.json`.

### Phase 8: Hero (S1) and decode (S7)

Six numbered sub-phases. Canvas work is last. Each has its own PR, recording and checks. This phase needs rules A4, A5, A6, A8, A9 approved (each is added in the sub-phase that first uses it).

- **8.1 Split and type:** split `Hero.tsx` into `HeroText`, `HeroWhois`, `HeroStrip`; set the very large name with the Geist `wght` axis (rule A9); add `--step-6`; boot reveal with CSS only. Check: `h1` is the LCP element (Lighthouse `largest-contentful-paint-element`) and LCP is no worse than Phase 0; the name is selectable and in static HTML (curl check); RU layout at 375 px.
- **8.2 Decode and numbers:** `decode()`, `data-decode` observer, `AnimatedNumber` rewrite (rule A1 decode class). Check: reduced motion shows final text; `aria-label` holds the real string; no decode on section numbers.
- **8.3 Dither module and seed:** `src/lib/dither.ts` with unit tests, the `git log` field seed generator in `generate:all` and `validate:all`, the protect-generated list update, and `scripts/generate-field-poster.ts` (rule A8). Check: unit tests pass; `npm run validate:all` passes; the poster is a low-priority background and the `h1` stays LCP; poster under 20 KB.
- **8.4 Canvas field, controls and effects setting:** `DitherField` island on Canvas 2D at half resolution and 15 fps, the visible `pause field` button, and the Settings control `effects: full / reduced / off` with a `settingsStore.ts` `version` bump and a `migrate` update (rule A4, A5). The setting is the rollback path: the owner or a visitor can switch the new effects off without a deploy. Check: canvas absent under reduced motion, `saveData` and `effects` not `full`; pause works by mouse and keyboard; `e2e/theme.spec.ts` updated for the new key version; no console errors (`hydration.spec.ts`); a still screenshot of the poster is added to the baselines; the lazy chunk is under the section 8 limit.
- **8.5 Name-as-dither mask:** glyph mask from the live name and `wght`, density following the seed, drawn behind the live text. Check: contrast pass on the hero in both themes; the mask matches the CSS name after `document.fonts.ready`; resize rebuilds the mask once.
- **8.6 Pointer response (rule A6):** cursor displacement on fine pointers only. Check: no listener is attached on `pointer: coarse`, under reduced motion or when `effects` is not `full` (Playwright with emulated media); no layout shift; frame time inside budget; the field is fully usable without the pointer.
- **Files:** `src/components/Hero/*`, `src/lib/{decode,dither}.ts`, `scripts/generate-field-poster.ts`, the field seed generator, `src/data/fieldSeed.ts` (generated), `AnimatedNumber.tsx`, `SettingsIsland.tsx`, `settingsStore.ts`, `index.astro`, `scripts/hooks/protect-generated.mjs`.

### Phase 9: Command palette and terminal (S6)

- **9.1 Shared command registry:** extract the registry from `Footer.tsx` into `src/lib/commands.ts` with unit tests. No visible change.
- **9.2 Palette:** a spike compares `cmdk` against a small combobox on Radix Dialog; keep `cmdk` only if it passes the focus, role and live-region checks and its measured size fits the budget. Then ship the palette, the nav opener and the hero hint. Check: Playwright covers open with `Cmd+K` and the button, filtering, selecting, `Esc` and focus return; accessibility check on the dialog; the palette chunk is not requested before first trigger; single-key shortcuts remain gated by the settings toggle (WCAG 2.1.4).
- **9.3 Mobile StatusLine sheet:** collapsed bar and bottom sheet. Check: 44 px targets, focus return, RU strings.
- **Files:** `src/lib/commands.ts`, `src/components/CommandPalette/*`, `KeyboardShortcuts.tsx`, `Nav.tsx`, `StatusLine.tsx`, `Footer.tsx`.

### Phase 10: Plates, covers, data panels and timeline (S5, S8, S9)

- **10.1 Project plates (S5):** plate generator using `ditherField`, `satori` and `resvg`; hover spec sheet. Check: unit test on the dither function (shared with 8.3); plate hover does not move layout; each caption names its source.
- **10.2 Generative covers and OG (S9):** heading parsing in the blog data generator, cover render, post header, OG composition, Cyrillic support for RU titles, correct section number (refactor item 1 fixes the drift). Check: regenerated OG and cover images inspected for EN and RU; two posts produce different covers; the same input gives an identical file; `<article>` structure unchanged.
- **10.3 SVG heatmap and sparkline (S8):** readable cells, readout, hidden table, reserved height. Check: each heatmap value reachable by keyboard; fetch failure shows a framed empty state with reserved height; caption says "public GitHub events".
- **10.4 Experience timeline rail (S8).** Check: layout at 375 px and RU strings.
- **Files:** `scripts/generate-plates.ts`, `scripts/generate-og-images.ts`, `scripts/generate-blog-data.ts`, `Projects.tsx`, `ProjectsPageIsland.tsx`, `BlogPostIsland.tsx`, `Decorations/*`, `ExperiencePageIsland.tsx`, `src/__tests__/dither.test.ts`.

### Phase 11: Architecture diagram (S10)

- **Scope:** the animated SVG of the site architecture. Skip this phase if the owner declines it in review; no other phase depends on it.
- **Acceptance:** every node and edge corresponds to code in the repo (checked by a short note in the PR with file references); no numbers without a source; drawn at once under reduced motion; markup under 4 KB.

### Phase 12: Secondary pages and polish

- **Scope:** a content-aware 404 (links drawn from real routes and posts), changelog filter by type, Privacy and Settings aligned to the new tokens, final polish pass with the `polish` and `audit` skills, a final `DESIGN.md` and `docs/Guidelines.md` consistency pass followed by `apply-skill-policy.sh`, a real-device pass, and the decision on which Lighthouse warnings become errors.
- **Files:** `NotFoundIsland.tsx`, `ChangelogIsland.tsx`, `PrivacyPageIsland.tsx`, `SettingsIsland.tsx`.
- **Acceptance:** `e2e/public-pages.spec.ts` texts still match ("Page not found", "Go home", "Changelog"); full CI green; final Lighthouse desktop and mobile within budget; field INP and LCP reviewed if RUM was approved; real-device results recorded.

## 8. Risks and guardrails

### Performance budgets

The hard limits per piece. A piece that exceeds its limit is cut back, not accepted.

| Piece | Budget | Gate |
|---|---|---|
| Hero field (S1: Bayer, field, name mask, pointer) | Lazy JS 6 KB gzip or less for all four parts together; render at half resolution; 15 fps cap; DPR 1; frame time 4 ms or less at p75 on a mid-range Android phone; paused when off-screen, hidden, in battery saver, or by the visitor | build output, trace, real-device check |
| Hero poster | 20 KB or less; low fetch priority; never the LCP element | build output, Lighthouse LCP element audit |
| Pointer response | One listener, frame-coalesced, no allocation per frame, 0.5 KB or less; absent on `pointer: coarse` | Playwright media emulation |
| Generative cover (S9) | 0 KB runtime JS; cover PNG 10 KB or less; OG PNG not larger than today's by more than 50% | build output |
| Plates (S5) | 0 KB runtime JS; 3 KB or less each | build output |
| Architecture diagram (S10) | 0 KB JS; 4 KB or less of markup | build output |
| Palette (S6) | Lazy chunk 15 KB gzip or less; 0 KB eager except the trigger | build output |
| Decode (S7) | 1 KB or less | build output |
| LCP | at most the Phase 0 value, target 2.0 s desktop, 2.5 s mobile; the LCP element is the `h1` | LHCI (warn today; promote to error once the mobile run is stable) |
| CLS | 0 target, under 0.02 in practice | existing 0.1 error gate, plus a Playwright layout-shift check |
| INP | under 200 ms | trace in each phase that adds interaction, field data if RUM is approved |
| Eager JS on `/` | no higher than Phase 0, goal lower after Phase 3 | build output diff in each PR description |
| Fonts | no new font files; no new global preloads | review |

LHCI has no mobile run and treats performance as a warning. Phase 0 adds a mobile preset and Phase 12 decides which warnings become errors. Lab numbers alone do not prove these budgets: if the owner approves RUM, field LCP and INP are read after each visible phase; if not, the gap is stated in the PR.

### Real-device testing

Emulated mobile Lighthouse does not catch thermal limits, Low Power Mode or compositor cost. For Phases 8.4, 8.5 and 8.6, the owner or the author runs the home page on an iPhone in Low Power Mode and on a mid-range Android phone for 60 seconds each. The checks are: no visible frame drops with the field running, the device is not warm to the touch, and battery drain in the 60 seconds is small. Results are written by hand in the PR. If the field fails on a device, the first fix is a lower frame rate or a smaller canvas; WebGL is not the first fix.

### Accessibility

- Reduced motion is tested two ways in every phase: OS flag and stored in-site flag. Today only the OS path cancels animations outright; Phase 1 removes the gap.
- The hero loop has a visible `pause field` control (WCAG 2.2.2) and the `effects` setting; reduced motion alone is not the only control.
- Decode keeps the real string in `aria-label` and the HTML.
- Pointer response is never the only cue. It is off for `pointer: coarse`.
- Palette, popovers and lightbox: focus trap, focus return, `Esc`, visible openers, 24 px minimum targets, focus not obscured by the sticky nav (`scroll-margin-top` from a nav-height token).
- Contrast is measured, not assumed, on every new decorative layer: dither behind the hero text, the `opacity: 0.88` prose, and hairline guides. Prose dimming by `opacity: 0.88` (`index.css` line 106) is replaced by an explicit color token so real contrast is measurable. An `accesslint` or axe pass runs on the dithered regions.
- `forced-colors: active` and the print stylesheet are checked for every new decorative layer.
- Lighthouse accessibility stays at or above 0.9 (CI error gate).

### SEO and agent surfaces

- Nothing starts hidden. Reveals use finished-by-default CSS; no block depends on JS to become visible.
- Keep: `<article>` > `<header>` > `<h1>` + `<time dateTime>`, JSON-LD, hreflang, canonical, RSS, `.md` endpoints, `llms.txt`, `llms-full.txt`, and the admin `noindex`.
- Canvas and SVG art are decoration; any caption text is real HTML.
- `theme.css` is shared with the admin SPA, so token changes need a manual admin check.
- OG images change in Phase 10.2 only.

### Platform constraints

- **CSP (closed question):** the facts are these. `public/_headers` sets the enforced policy with `script-src 'self' 'unsafe-inline'` (line 9). `src/middleware.ts` (lines 17 to 28) creates a per-request nonce and replaces `'unsafe-inline'` in `script-src` for server-rendered responses; prerendered pages use the static `_headers` value. A Report-Only policy (line 10) uses `script-src 'self'` with no inline, so any new inline script is reported. Rule: all new client code is an external same-origin module; no new inline scripts, no `blob:` workers, no remote fonts, textures or scripts, no `eval`. Phase 0 confirms the header on a prerendered page with `curl -I` as a final check.
- **`ClientRouter`:** every new script must run on `astro:page-load` and be idempotent; the canvas loop, its listeners and its `requestAnimationFrame` handle must be cancelled on `astro:before-swap` and recreated on the next page load. Reuse the existing hook points instead of adding a parallel mechanism.
- **Generated files:** `src/data/*` and `db/seed.sql` are never hand-edited; the protect hook enforces it. New generators (`generate-field-poster`, the field seed, `generate-plates`, covers) join `generate:all` and `validate:all`, and the new generated data file is added to the protect list.
- **havamal sync:** it overwrites synced MDX. Any new MDX component or figure syntax needs a matching change in `havamal/` first.
- **Bilingual:** every new string goes through `t()` in `src/lib/i18n.ts` with EN and RU entries. Every phase includes a Russian check at 375 px for new strings, including decode widths, the field caption, the pause control, the palette and the cover caption. Cyrillic is also checked in OG and cover text.
- **Persisted prefs:** the new `effects` setting bumps `version` in `settingsStore.ts` (now 3) and updates `migrate`; `e2e/theme.spec.ts` reads the key directly.
- **Content-visibility:** `content-visibility: auto` on prose `h2` and `pre` can break scroll-driven effects, TOC jumps and full-page screenshots. Test in Phase 7.3; remove it if it misbehaves.
- **Screenshots:** baselines are made only in the pinned CI container (Phase 0).

### E2E churn

Names and roles that tests depend on and must not change without updating the spec in the same PR: `navigation` named "Primary" and its link names; page title formats; `[data-section-name]`; settings buttons `light`, `dark`, `system`; blog "All" button; lightbox dialog "Image viewer" with "Next image", "Close", "Figures" and "Go to figure 2"; `?fig=N`; the `site_preferences` storage key; KaTeX layout at 375 px. `hydration.spec.ts` fails on any console error except CSP lines and waits for `networkidle`, so a constant poll or a canvas error breaks four tests; the field must not start a network poll and must not log. Screenshot baselines must be updated deliberately, not on every run.

### Process guardrails

- Every phase ships a runnable visible or measurable change, except Phase 0 (the measurement gate) and the pure refactor Phases 1 to 4, which gate the later visual phases by removing rework. Each names what it gates.
- No phase is closed on a refusal path alone. Each fallback (poster, still frame, no-JS, `effects: off`) is verified, and the positive path is verified separately.
- Nothing merges to `main`, deploys, or touches remote Cloudflare resources without owner approval.
- Sources for exemplars in `research.md` marked [secondary] are not copied until the live site is opened.

## 9. What was not checked

- Nothing was rendered, built or measured. All sizes, scores and line counts come from source reading or from the research file.
- `node_modules` was absent when the critique was made, so Motion 13 (`ScrambleText`), `cmdk` and Shiki transformer APIs are not confirmed.
- `VisitorContext.tsx` and `activityStore` have no known consumers inside `src`; consumers outside `src` were not searched.
- The dead-token list is from a single-hit heuristic and needs an AST pass.
- The prerendered-versus-server-rendered split of the CSP is read from `_headers` and `src/middleware.ts`; no response header was fetched.
- Whether the OG generator writes one image per language was not confirmed.
- Whether the existing analytics host can record field LCP and INP was not checked.
- No real-device or cross-browser run was made.

## 10. Owner decisions (resolved 2026-10-30)

1. **`DESIGN.md` rules:** the owner approved any change. Rules A1 to A11 still land one phase at a time, in the same PR as the feature that uses them.
2. **Hero set:** build all four: name-as-dither with a variable-weight name (S1), the pointer-reactive field on fine pointers (A6), per-post generative covers reused as OG images (S9), and the live architecture diagram (S10, no longer optional; still the first item to cut if it breaks its budget).
3. **Static home sections become Astro components now.** Phase 3 converts `Projects`, `Experience`, `BlogPreview` and `Links` to `.astro`. Prerequisite inside Phase 3: these sections need their language in the static output, because today the language is a client-side Zustand value. Render both EN and RU markup and show one by the `lang` attribute that the head script sets before paint, or add locale routes; choose in the Phase 3 PR after measuring HTML size. Phase 3 acceptance adds: no React or Motion chunk for these sections, no hydration mismatch, the language switch still works without a reload, and the e2e language tests pass.
4. **Circular theme wipe comes back**, which reverses commit `a0146f7`. It runs through `document.startViewTransition` with a `clip-path` circle from the toggle position, in the same phase as the page transitions (Phase 6). Reduced motion and `effects: reduced/off` fall back to the current simple fade, and the wipe must not run the blanket `[class*="bg-"]` transition at the same time. Update the `theme.css` comment that records the removal.
5. **Width and grid:** content max goes from 1160 px to 1240 px for home and project pages, the blog keeps the 46rem prose measure, and the visible grid guides are a Settings toggle that defaults to on.

Also decided: stay on Astro `ClientRouter` (native cross-document transitions lose `transition:persist` for Nav, StatusLine and the footer shell); the hero uses Canvas 2D and not WebGL; the hero seed is build-time `git log` counts.
