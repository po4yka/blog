# Design System — po4yka.dev

## 1. Visual Theme & Atmosphere

The site is a **Swiss / International Typographic Style surface fused with an operator-console industrial layer** — a well-configured developer workstation, not a startup landing page. The terminal metaphor is kept: `$` prompts, boot blocks, tree branches, IBM 3270 field codes, numbered section labels. What is stripped is the macOS window theatre: no traffic lights, no drop shadows on flat panels, no chromatic accent color.

The palette is neutral greyscale. Dark mode defaults to a near-black graphite canvas (`#0b0b0c`) with eggshell text (`#e9e8e4`). Light mode is warm paper (`#f5f3ee`) with ink (`#101012`). Emphasis is pure white on dark, pure black on light — weight and rule weight do the work that color used to do.

Typography leads with **Geist Sans** for headings, navigation, UI labels, and site chrome. **Geist Mono** is demoted to code, terminal output, and metadata strips. **Piazzolla** — a variable high-contrast serif with native Cyrillic — carries long-form blog prose. The split is deliberate: technical chrome stays geometric and cold-eyed, while reading surfaces pick up editorial warmth.

**Key characteristics:**
- Near-black graphite canvas (`#0b0b0c` dark) / warm paper (`#f5f3ee` light)
- No chromatic accent. Emphasis = `--emphasis` (pure white dark / pure black light) + weight + underline
- Geist Sans as the primary type voice; Geist Mono for code and operator labels only; **Piazzolla** (variable serif) exclusively for `.prose-blog` long-form reading
- Flat operator panels: `1px solid var(--border)`, `2px border-radius`, no shadow, no window chrome
- Numbered section system: every section except the hero opens with `SectionHeader` — `02 / ABOUT`, `03 / CONTACT`, `04 / PROJECTS`, `05 / EXPERIENCE`, `06 / WRITING` (blog preview), `07 / WRITING` (blog index), `08 / CHANGELOG`, `09 / SETTINGS`, `10 / PRIVACY`, `!! / NOT FOUND`. The hero panel carries `01 / IDENTITY`
- Hairline rules as structural dividers — `var(--rule)` token
- 12-column grid with faint column guides and registration marks on wide screens (see "Grid guides and registration marks" in section 5)
- Restrained motion that carries state: fade-in on mount, rules and frames that draw on, opacity shift on hover (rule A1, section 9)
- Terminal output uses real mobile dev tool patterns: `adb`, `gradle`, `xcode`, `fastlane`, `git`, `ktlint`

---

## 2. Color Palette & Roles

### Dark Theme (default — graphite + eggshell)

| Token | Value | Role |
|-------|-------|------|
| `--background` | `#0b0b0c` | Page canvas |
| `--foreground` | `#e9e8e4` | Primary text — eggshell, ~14.6:1 on bg |
| `--card` | `#141416` | Section panels, operator blocks |
| `--secondary` | `#18181b` | Nested containers |
| `--muted` | `#1e1e22` | Subtle fills, hover state backgrounds |
| `--muted-foreground` | `#a6a6ac` | Secondary labels — 7.8:1 on bg |
| `--muted-foreground-dim` | `#8a8a90` | Tertiary labels — 6.5:1 on bg, 4.8:1 on card |
| `--border` | `rgba(233,232,228,0.10)` | Panel edges, hairline separators |
| `--rule` | `rgba(233,232,228,0.14)` | Section divider rules |
| `--emphasis` | `#ffffff` | Full-luminance emphasis, focus rings |
| `--code-bg` | `#16161a` | Code block backgrounds |
| `--destructive` | `#e8634b` | Destructive actions + invalid-form flash only |
| `--panel-bg` | `rgba(20,20,22,0.65)` | Translucent panel background (sidebar widgets) |
| `--nav-glass` | `rgba(11,11,12,0.85)` | Sticky nav backdrop after the page scrolls (with blur, rule A7) |
| `--nav-glass-subtle` | `rgba(11,11,12,0.55)` | Sticky nav backdrop at the top of the page (no blur) |
| `--overlay-shadow` | `0 16px 48px rgba(0,0,0,0.5)` | Floating overlays only (dialogs, dropdowns) |

### Light Theme (warm paper + ink)

| Token | Value | Role |
|-------|-------|------|
| `--background` | `#f5f3ee` | Warm paper canvas |
| `--foreground` | `#101012` | Primary text — ink |
| `--card` | `#fefefc` | Section panels |
| `--secondary` | `#ebe8e2` | Nested containers |
| `--muted` | `#dedcd5` | Subtle fills |
| `--muted-foreground` | `#4a4a50` | Secondary labels — 8.5:1 on bg |
| `--muted-foreground-dim` | `#5e5e64` | Tertiary labels — 6.0:1 on bg, 4.8:1 on `--muted` |
| `--border` | `rgba(16,16,18,0.16)` | Panel edges — stronger than dark: warm paper swallows low-alpha ink |
| `--rule` | `rgba(16,16,18,0.20)` | Section divider rules |
| `--emphasis` | `#000000` | Full-luminance emphasis, focus rings |
| `--code-bg` | `#eeebe4` | Code block backgrounds |
| `--destructive` | `#b83a28` | Destructive actions + invalid-form flash only |
| `--panel-bg` | `rgba(255,255,255,0.70)` | Translucent panel background |
| `--nav-glass` | `rgba(245,243,238,0.85)` | Sticky nav backdrop after the page scrolls (with blur, rule A7) |
| `--nav-glass-subtle` | `rgba(245,243,238,0.55)` | Sticky nav backdrop at the top of the page (no blur) |
| `--overlay-shadow` | `0 12px 32px rgba(16,16,18,0.18)` | Floating overlays only (dialogs, dropdowns) |

### Emphasis Rule

There is no chromatic accent. The only "accent" is `--emphasis` — pure white on dark, pure black on light. Acceptable uses:
- Active navigation link (weight 500 + 1px underline rule)
- Inline text link underline on hover
- Key heading or identity display moment
- Focus ring: `outline: 2px solid var(--emphasis); outline-offset: 3px`

`--destructive` is the only non-neutral color token and is reserved strictly for destructive UI actions (delete, irreversible operations). Do not use it as decoration.

---

## 3. Typography Rules

### Font Families

```css
--font-sans:  "Geist Variable", "Geist", system-ui, sans-serif;
--font-mono:  "Geist Mono Variable", "Geist Mono", "Fira Code", ui-monospace, monospace;
--font-pixel: "Geist Pixel", "Geist Mono Variable", ui-monospace, monospace;
--font-serif: "Piazzolla Variable", "Piazzolla", "Piazzolla Fallback", Georgia, "Iowan Old Style", "Charter", "Times New Roman", serif;
```

The full stacks are defined once, in the `@theme static` block of `src/styles/tailwind.css`; that block is the only source of the variables and the `font-*` utilities.

- **`--font-sans`** — headings (including inside blog prose), navigation, labels, button text, UI copy, site chrome
- **`--font-mono`** — code blocks, terminal output (`Cmd`, `BootBlock`, `InfoTable`), `.label-meta` metadata strips. Code blocks are syntax-highlighted in monochrome only (`src/lib/shiki-mono.ts`): keywords at `--emphasis` weight 500, identifiers at `--foreground`, strings at `--muted-foreground`, comments at `--muted-foreground-dim` italic. Never introduce a chromatic Shiki theme
  - Exception: the single-line role subtitle directly beneath the hero name (`display-name`) may use `--font-mono` (`text-mono-lg`). It's load-bearing terminal voice — not body copy — and rendering it in sans dilutes the identity. Cap at one line. No other prose surface uses mono.
- **`--font-pixel`** — rule A10: decorative counters only, never body text or labels. There is no cap on the number of uses per page
- **`--font-serif`** — blog post body prose only (`.prose-blog` block-level text). Variable wght 100–900. Latin + Latin-Ext + Cyrillic + Cyrillic-Ext subsets self-hosted in `public/fonts/piazzolla-*.woff2`. Never ship on non-post surfaces.

Fira Code is an optional fallback in the mono stack for code blocks where programming ligatures help. Do not ship it unless ligatures are intentionally enabled.

### Type Scale

| Class | Size | Weight | Tracking | Use |
|-------|------|--------|----------|-----|
| `display-name` | `--step-6`, clamp(48px–120px) | 300 and 650 | -0.035em | Hero name only, two lines, rule A9 |
| `display-1` | clamp(40px–64px) | 500 | -0.028em | Page-level identity |
| `display-2` | clamp(28px–40px) | 500 | -0.020em | Major section heads; with `.display-serif` (Piazzolla, wt 560, clamp 30–44px) for blog post titles and blog-index titles |
| `h1` | clamp(28px–36px) | 500 | -0.015em | Page headings |
| `h2` | 20px | 500 | -0.010em | Section headings |
| `h3` | 17px | 500 | 0 | Sub-section headings |
| `h4` | 15px | 500 | 0 | Minor labels |
| body | 15–17px | 400 | 0 | UI copy, navigation |
| `label-meta` | 11px mono, uppercase | 400 | 0.12em | Metadata strips, section number labels |

**Minimum text size: 11px**, everywhere including the admin SPA. Sizes in rem that can drop below it at the compact 15px root use `max(11px, <rem>)` (the `text-xs` and `text-label` tokens do this). The fluid sizes of `display-1` (`--step-5`), `.display-serif` (`--step-4`), `h1` (`--step-3`) and the blog prose (`--step-0` to `--step-2`) come from tokens in `src/styles/tokens.css`.

All headings use `--font-sans` — including h2/h3/h4 *inside* blog prose, so the TOC and the article structure stay in the same voice as site chrome. The two exceptions are the post `<h1>` and the blog-index `<h2>` titles, which take `.display-serif` (Piazzolla) so the blog has its own editorial voice against the geometric chrome. `label-meta` uses `--font-mono`. Blog post body prose uses `--font-serif` (Piazzolla) at 17px, line-height 1.7, `letter-spacing: 0`, `font-feature-settings: "kern","liga","clig","calt"`, max-width 46rem (~70ch with Piazzolla).

### Hierarchy Rules

- Create depth through **weight** (400 → 500), **opacity** (`/70`, `/50`, `/30`), and **rule weight** — not through font switching
- Opacity layers: primary text full, secondary at `/70`, tertiary at `/50`, decorative at `/25`–`/35`
- `--font-mono` appears only where its character is load-bearing: code, status output, numbered labels
- Base font size: 15px (user-configurable: 14px compact / 15px default / 17px large via `--font-size`)
- Line height: 1.4 for headings, 1.7 for prose, 1.5 for UI labels
- Tabular figures on all numeric data: `font-variant-numeric: tabular-nums`

---

## 4. Component Stylings

### Operator Panel Kit — Primary Design System

Flat bordered containers replace the former macOS window chrome. No traffic lights, no drop shadows, no rounded corners beyond 2px.

**Primitives** (`src/components/ui/`, styles in `src/styles/primitives.css`)
- `Panel` draws every flat panel frame: `var(--card)` (or `tone="translucent"`, `var(--panel-bg)`), `1px solid var(--border)`, 2px radius. `clip` sets overflow: `hidden` (default), `clip` (clips without a scroll container, so `position: sticky` children such as the blog TOC keep working) or `visible`. Do not hand-write the border, radius and background again.
- `Reveal` is the entrance fade: a CSS `@starting-style` opacity fade on first render, with `delay` (seconds, for staggers) and `speed` (`fast`, `base`, `slow` = `--dur-*`). The static HTML is already in its final state, so content shows without JS, without `@starting-style` support and under reduced motion. Never ship content at `opacity: 0` in the server HTML. A `transition-*` utility on the same element replaces the fade, so its property list must include `opacity` (as the nav and the blog back link do), or the element goes inside a wrapper Reveal. `instant` skips the fade for above-the-fold LCP content.
- `Em` is emphasis text: `--emphasis` at weight 500.
- `T` renders a translated string in both languages for server-only sections; `html[data-locale]`, set before paint by `ThemeScript.astro` and kept in sync by `settingsStore`, shows one, so there is no wrong-language flash and no client JS. Sections with no interactive state (the home Links, Projects, Experience and Blog sections) render with no `client:*` directive and use `T`; hydrated islands keep `useLocale().t`.
- Data panels that load on the client (commit log, open source, activity) render their full frame in every state (loading, loaded, unavailable), so the page never shifts, and say plainly when their data is unavailable.

**OperatorPanel**
- Background: `var(--card)`
- Border: `1px solid var(--border)`, `border-radius: 2px`
- No shadow, no traffic lights, no titlebar gradient
- Header row: 32px tall, hairline `border-bottom: 1px solid var(--rule)`
- Header left: `<span class="label-meta">{sectionNumber} / {LABEL}</span>`
- Header right: `titleExt` in `--font-mono` 11px `--muted-foreground-dim`
- Opt-in props: `lineNumbers` (left gutter), `statusLine` (vim-style bottom bar)

**PanelShell**
- Background: `var(--card)` — no glass, no blur on primary content
- Border: `1px solid var(--border)`, `border-radius: 2px`
- Top label row: `.label-meta` on left, mono 11px `--muted-foreground-dim` on right
- Used for: sidebar widgets, compact real-data panels (build stats, activity, latest post, latest release)

**BootBlock**
- Status prefix format: `OK ·` / `INFO ·` / `WARN ·` — no brackets, no color coding
- Status color: always `--muted-foreground`; font `--font-mono` 13px
- Keep to 4–6 lines maximum; do not use as filler

**Cmd**
- Renders `$ command` prompt line
- Prompt `$`: `--emphasis` at `/70`
- Command text: `--foreground` at `/80`
- Font: `--font-mono`, 13px
- Introduces content sections; acts as a section divider

**OutputBlock**
- Indented output wrapper with fade-in stagger
- Left border: `2px solid var(--rule)`
- Padding-left: `1rem`
- Font: `--font-mono` 12px at `/70`

**InfoTable**
- Two-column key-value table for structured data (`whois`, project metadata)
- `fieldCodes` mode: IBM 3270 format `[01] KEY ......: value`
- Key column: `--font-mono` 11px `--muted-foreground` — right-aligned
- Value column: `--font-sans` 14px `--foreground` — left-aligned
- Row separator: `border-bottom: 1px dashed var(--rule)`

**SectionHeader**
- New shared component at `src/components/SectionHeader.tsx`
- Row 1: `.label-meta` left (`04 / PROJECTS`) + right (`8 RECORDS · 2025–26`)
- Row 2: `<h2>` at 20px Geist Sans — visible, not `sr-only`
- Row 3: `border-bottom: 1px solid var(--rule)`. The rule draws as the header scrolls into view where scroll timelines exist, and on load otherwise (rule A2)
- `marks` prop (default `true`) puts a registration mark on each end of the rule (see "Grid guides and registration marks" in section 5). Set `marks={false}` on narrow or nested headers, for example in `NotFoundIsland` and `PrivacyPageIsland`
- Applied to every home section except the hero, and to every primary page header

**Error flash** (`form-flash` keyframe — for invalid form feedback)
- One-shot `@keyframes form-flash { from { outline-color: var(--destructive); } to { outline-color: transparent; } }`
- Wrapper must have base outline: `outline: 1px solid transparent; outline-offset: 4px; border-radius: 2px`
- Re-triggered via React `key={invalidCount}` remount so repeated failures restart cleanly
- Replaces the AI-cliché horizontal shake animation (`x: [-8, 8, -6, 6, -3, 3, 0]`) for rejected-credentials feedback
- Reduce-motion: already caught by the global reduced-motion rule in `tokens.css` (`animation-duration: 0.01ms`, so the fill-mode end state still applies)

### Buttons

**Primary**
- Background: `var(--muted)`
- Text: `var(--foreground)`
- Border: `1px solid var(--border)`
- Radius: `2px`
- Hover: background shifts to slightly lighter muted value

**Secondary**
- Background: transparent
- Text: `var(--muted-foreground)`
- Border: `1px solid var(--border)`
- Radius: `2px`
- Hover: text lifts to `var(--foreground)`

**Ghost / Inline**
- No background, no border
- Text: `var(--muted-foreground)`
- Hover: text lifts to `var(--foreground)`, 1px underline appears

**Press feedback (all button variants)**
- Use Tailwind `active:opacity-70` for click / tap feedback — a brief 30 % dim on press
- Rule A3: hover and tap states may change opacity, background, underline and outline. They never change width, height, margin, position or scale
- Do NOT use `whileTap={{ scale: 0.9N }}` / `rotate: ±180` / spring bounce — these are AI-slop tells
- Do NOT use `animation: "pulse-scale …"` on status dots — keep ambient dots static

No pill-shaped buttons (9999px radius). No gradient buttons. No oversized CTAs.

### Navigation

- Sticky nav (`src/components/Nav.tsx`): `var(--nav-glass-subtle)` at the top of the page. After the page scrolls it changes to `var(--nav-glass)` and adds `backdrop-blur-sm` (rule A7). The bottom line is `1px solid var(--rule)`
- Rule A7: this nav blur is the single allowed backdrop blur on the public site. The admin SPA has its own `backdrop-blur-sm` on its mobile top bar (`src/admin/components/AdminLayout.tsx`). No other surface uses blur
- Links: Geist Sans 14px, `var(--foreground)` at `/60`
- Active link: `var(--emphasis)` weight 500 with 1px underline rule — no color jump
- Mobile: overlay with `var(--mobile-menu-bg)` fill and a `var(--rule)` top line

### Command Palette

- Component: `src/components/CommandPalette/CommandPalette.tsx`, a Radix Dialog with one combobox input (`role="combobox"`, `aria-activedescendant`) and a `role="listbox"` of grouped options (Pages, Posts, Projects, Actions, Sections). A polite live region reports the result count
- Panel: flat, 1px `var(--border)`, 2px radius, `var(--overlay-shadow)` like other dialogs, max width 40rem, placed in the top third of the viewport, full width and anchored to the top below `sm`. Rows are at least 44px high. The active row uses `bg-muted`, `var(--emphasis)` text and a 2px `var(--emphasis)` left rule, with no accent color. The input border changes to `var(--emphasis)` on focus
- Type: Geist Sans for row titles, Geist Mono for the input, the typed command and the row fields (`label-meta` for group names)
- Motion: opacity only on open and close, none under reduced motion
- Shortcuts: Cmd+K or Ctrl+K (matched by physical key, so it works on any keyboard layout) opens it. This is a modifier shortcut, so the Settings toggle for single-key shortcuts does not gate it. Opener buttons are in the desktop nav and the mobile menu. The hero shows a static hint line. `/` still focuses the footer shell
- Data rule: every row is a real entry (a route, a generated post or project, a theme or locale, the contact email, or a heading on the current page) and shows the equivalent typed command. Rows run through `run()` in `src/lib/commands.ts`, the same registry the footer shell uses. A typed command line also runs on Enter, and its output (or the unknown-command error) shows inside the palette. Post rows show the date label and word count. Project rows show the year and platforms. No invented commands, fields or counts
- Loading: the palette chunk is requested on first open, or on idle after the first pointer or key event. It is not part of the first page load

### Project Plates

- Component: `src/components/ui/Plate.tsx`, on the home project rows (32px) and on `/projects` entries (48px). Hidden below `sm`
- Source: `scripts/generate-plates.ts` writes `public/plates/<slug>.svg` and `<slug>.hover.svg` at build time (`generate:all`, checked by `validate:all`). Each is a 16x16 1-bit mark from `ditherField` in `src/lib/dither.ts` (ordered Bayer dither), mirrored on the vertical axis
- Seed (rule A8): the FNV-1a hash of the project slug, and nothing else. A plate is an identity mark, not a metric. Its caption prints the seed as `slug#<4 hex>` (the `/projects` meta row and the `MARK` line of the home spec sheet)
- Colour: the SVGs are CSS masks over `currentColor`, so a plate is `var(--foreground)` at reduced opacity in both themes, with no fill colour of its own
- Hover and keyboard focus (rule A3): the hover file holds only the pixels a higher density adds, so the plate fills in by opacity alone. On the home rows the description and a spec sheet (`STACK`, `PLATFORMS`, `REPO` when a GitHub link exists, `MARK`) share one grid cell and swap by opacity, so the row height never changes. The spec sheet repeats `projects.json` fields and is `aria-hidden`
- Budget: 0 KB runtime JS, each SVG under 3 KB

### Post Covers

- Component: the `figure` at the end of `PostHeader` (`src/components/blog/PostHeader.tsx`), after the `h1`, its `time`, the tags and the "also available as" line, full prose width at a 6:1 ratio. The art is `aria-hidden`; the caption is real text
- Source: `scripts/generate-covers.ts` writes `public/covers/<lang>-<slug>.svg` at build time (`generate:all`, checked by `validate:all`). Each is a 144x24 1-bit field from `coverField` in `src/lib/cover.ts`, ordered-dithered with `ditherField`
- Seeds (rule A8), all from the post's own MDX: the slug hash picks the wave pattern, the word count sets the density, each heading is one band (an h2 band fills the height, each level deeper starts a third lower, two paper columns between bands), and the publish date shifts the phase. One cover per language, like the OG images; the two languages share the slug, headings and date, so they look related
- Caption: `cover: <slug>, <words>, <headings>, <YYYY-MM-DD>` in `.label-meta`, with localized plurals
- Colour: a CSS mask over `currentColor` at `var(--foreground)` 45%. Tone is capped below solid ink, so every region keeps a dither texture
- OG card: the same pixels, in the meta grey, as a 992px band between the title and the footer row of `public/og/<lang>-<slug>.png`
- Budget: 0 KB runtime JS beyond the caption helper, each SVG under 10 KB

### Tags / Platform Badges

- Background: `var(--muted)`
- Text: `var(--muted-foreground)`
- Font: `.label-meta` (11px mono uppercase, tracking 0.12em)
- Radius: `2px` — not pill-shaped
- Use sparingly for: Android, iOS, KMP, MobileOps, CI/CD, blog categories, dates

### Blog List Items

- Hover interaction: underline appears via `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)`
- Underline color: `var(--foreground)` at `/60`
- Transition: `0.3s ease`
- No card containers for blog lists — editorial rows only

---

## 5. Layout Principles

- **Max content width:** `--grid-max` (1240px) in `src/styles/tokens.css`, used by the page shell, nav and footer
- **Grid:** 12-column CSS grid primitive (`.page-grid` in `src/styles/theme.css`): `grid-template-columns: repeat(var(--grid-cols), minmax(0, 1fr))` and `gap: var(--grid-gap)` (1.5rem). It has no padding. The page gutter is `--grid-pad` on the page shell (`MainLayout` `<main>`, `Nav`, `Footer`, `StatusLine`): 1.5rem, 2.5rem from 768px and 3rem from 1024px
- **Base radius:** `2px` — sharp, Swiss-derived; no soft rounded corners on panels
- **Atmosphere (rule A11):** one signature per viewport, never two decorative blocks adjacent. Each decorative block is backed by real data (see section 10) and relates to a real mobile dev tool (adb, gradle, xcode, fastlane, git, ktlint). There is no fixed count of decorative blocks per page.
- **Asymmetric over symmetric:** editorial, off-center compositions. Vary section layout while keeping the same design language.
- **Whitespace:** generous. Panels need breathing room. Never pack sections tightly.

**Grid column assignments:**
- Hero: identity (name, role, intro, meta strip, CTAs) cols 1–7, `whois` spec-sheet panel cols 8–12; a 4-up strip of real-data panels (latest post, build, activity, release) sits below the split. Only the two content panels render on mobile. The name is on two lines (given name, family name) at `--step-6` (`.display-name`). The hero is static server markup in `src/components/Hero/` with no island on the identity path, so the name is in the HTML in both languages and the `h1` paints at once with no reveal. Only `ActivitySparkline` (`client:only`, because its day labels depend on today's date) and `LatestReleasePanel` (`client:visible`) are islands, because they fetch from GitHub; `LatestReleasePanel` does not hydrate on mobile, where it is hidden
- Blog post: two-track layout on `lg+` — article column (capped at 46rem prose) + `14rem` sticky TOC sidebar (`lg:grid-cols-[minmax(0,1fr)_14rem] gap-10`). Below `lg` the sidebar hides and the article spans full width of the `LessViewer` panel, prose still capped at 46rem. The TOC is built at build time from the headings, so it is in the static HTML. On `lg+` the active item shows a 1px `--emphasis` line on its left edge that grows with the scroll position inside that section (`--section-progress`). Below `lg` a fixed bottom bar shows the active section and a "Contents" button that opens a native `<dialog>` bottom sheet with the same list. A 1px reading progress rail (`.progress-rail`) at the top of the viewport shows the scroll position of the post. The post body has no entrance fade (`LessViewer instant`), because it is the largest contentful paint element. On touch devices (`hover: none`) the heading permalinks are always visible and have a 44px tap target.
- Project list: cols 1–12 single column
- Experience timeline: cols 1–8, year column cols 9–12

**Good layout patterns:**
- Split hero: identity display + operator sidebar (desktop only)
- Alternating project rows with varying alignment
- Timeline-style experience blocks with year on the right
- Editorial stacked blog list with strong metadata

**Avoid:**
- Three equal cards in a row as the default
- Identical section structure repeated throughout
- Full-width background fills on every section
- Atmospheric blocks hidden behind primary content

### Grid guides and registration marks

The page shows its 12-column grid as faint vertical hairlines (guides) and a small crosshair (registration mark) on each end of a `SectionHeader` rule. Styles are in `src/styles/grid.css`. Both are decoration only.

**Tokens** (`src/styles/tokens.css`, "Layout grid" block)
- `--grid-max`: 1240px
- `--grid-cols`: 12
- `--grid-gap`: 1.5rem. It equals the `gap-6` of the 12-column grid on `/projects`, so its columns line up with the guides
- `--grid-pad`: the page gutter, 1.5rem, 2.5rem from 768px, 3rem from 1024px
- `--grid-line`: `color-mix(in oklab, var(--border) 55%, transparent)`, the guide colour in both themes
- `--mark-size`: 7px

**Guides.** `MainLayout.astro` renders a `.grid-guides` layer before `<main>`: `position: fixed`, `inset: 0`, `z-index: -1`, `pointer-events: none`, `aria-hidden="true"`, with 12 empty `<span>` elements in a `.page-grid`. It is plain markup with no island and no JavaScript. Its content box equals the content box of `<main>`, so the first and last guide sit on the panel edges. The layer paints above the page background and below every panel, so panels hide the lines and transparent sections show them.

**Marks.** A `SectionHeader` with `marks` (default `true`) gets the `.reg-marks` class. Two 7px crosshairs (`::before` and `::after`, `--muted-foreground-dim`) sit on the bottom corners of the header, centred on the outer guides. `marks={false}` turns them off for narrow or nested headers.

**When shown.** Guides and marks show only from 1024px (`lg`), where the 12 columns exist. Below 1024px the layouts have one column and a line would cross running text.

**Toggle.** The Settings page has a "grid guides" setting (`gridGuides`, default on). `ThemeScript.astro` sets `data-grid="off"` on `<html>` before first paint when the visitor turns it off, and `settingsStore` keeps the attribute in sync. Under `html[data-grid="off"]` both guides and marks are hidden.

**Print and forced colors.** Guides and marks are hidden in `@media print` and in `@media (forced-colors: active)`. The hiding is on purpose: in those modes the lines add noise and no meaning.

**Hero exception (rule A11).** The hero does not use `SectionHeader`, so the hero panel has no marks. The first marks are on the About header below it, which shows in the first viewport only on tall screens.

**Guides and marks are the baseline (rule A11).** They are the page grid, not a signature: they do not count toward the one signature per viewport, and a signature (for example the hero field) sits on top of them.

**Alignment rule.** Full-width panels and the 12-column grid on `/projects` sit on the guides. A new layout uses the same gutter (`--grid-pad`), the same gap (`--grid-gap`) and column spans of the `.page-grid`. Do not add a second grid with other values.

---

## 6. Depth & Elevation

Depth comes from **background tone shifts** and **hairline borders** — not shadows.

| Surface | Treatment |
|---------|-----------|
| Page canvas | `var(--background)` — no shadow, no border |
| Operator panel (`OperatorPanel`) | `Panel`: `var(--card)` + `1px solid var(--border)` |
| PanelShell widget | `Panel tone="translucent"`: `var(--panel-bg)` + `1px solid var(--border)` |
| Sticky nav | `var(--nav-glass-subtle)`, then `var(--nav-glass)` + blur after scroll (rule A7), with `border-bottom: 1px solid var(--rule)` |
| Nested containers | `var(--muted)` — no shadow |
| Loading indicators | `[LOADING...]` bracket cycle (`.loading-bracket`) — static mono text, no skeleton shimmer |

**Zero shadows on:** panels, buttons, tags, blog list items, footer, any flat surface. Shadows are reserved for floating overlays (dialogs, dropdowns) only.

---

## 7. Do's and Don'ts

### Do
- Use operator panels (`OperatorPanel`, `PanelShell`, both built on `Panel`) as the primary content framing unit
- Use `SectionHeader` with numbered labels (`01 / IDENTITY`) at the top of every major section
- Build hierarchy through weight (400→500), opacity layers, and hairline rules — not color
- Keep terminal output real, not invented — real mobile dev tools: `adb`, `gradle`, `xcode`, `fastlane`, `git`, `ktlint`
- Hide excess decoration on mobile (`hidden sm:block`) to keep content scannable
- Use underline-on-hover via `clip-path` animation — not color jumps
- Respect reduced motion — `<html data-motion="reduce">` is set before paint when the OS asks for it or the visitor turns motion off in Settings; `tokens.css` cuts CSS animations and transitions under it, and Motion animations follow the same setting because `MotionProvider` reads the settings store (not the attribute)
- Use tree-branch unicode (`├──` `└──` `│`) inside panel list content for terminal density
- Use IBM 3270-style field codes (`[01] KEY ......: value`) in InfoTable for dense data display
- Use `.label-meta` (mono 11px uppercase letter-spaced) for all metadata strips and the section label after the number (the number itself is Geist Pixel, rule A10)
- Use `font-variant-numeric: tabular-nums` on all numeric data
- Seed generative art from real inputs only and print the seed in its caption (rule A8): the slug hash for project plates; slug, word count, heading depths and publish date for post covers. Allowed seeds are build-time `git log` day counts, GitHub public events, `projects.json` fields, and a post's slug, word count, heading structure and publish date

### Don't
- No chromatic accent colors — no purple, no teal, no amber as accent
- No gradient backgrounds or buttons
- No drop shadows on flat panels or cards
- No glassmorphism on any surface. The one backdrop blur is the nav blur (rule A7, plus the admin top bar)
- No pill-shaped buttons or container radii beyond 2px
- No generic SaaS card grids
- No fake metrics or KPI cards presented as real data — if there is no real data source, do not render the widget
- No Matrix/hacker aesthetic — no green-on-black, no code rain, no CRT bezels
- No phosphor glow, no scanlines, no cursor-glow, no parallax, no mouse-follow
- No more than one decorative signature per viewport (rule A11)
- No stacking two decorative blocks back-to-back
- No ASCII art illustrations — box-drawing characters for structure are fine; character art is not
- No `--font-mono` for body text or headings — monospace is demoted to code and operator labels only
- No `whileTap={{ scale }}` / `whileTap={{ rotate }}` — bounce-on-press is an AI tell; use `active:opacity-70` (rule A3)
- No hover or tap state that changes width, height, margin, position or scale (`whileHover` and `whileTap` included) — hover feedback is opacity, background, underline and outline only (rule A3)
- No `animation: "pulse-scale …"` on status dots or anywhere else — status dots stay static
- No legacy tokens: `--accent`, `--accent-N`, `--phosphor-glow`, `--titlebar*`, `--window-shadow*`, `--dot-dim`, `--signal-*` were all deleted — do not re-introduce them
- No `text-accent` / `bg-accent` / `hover:text-accent` classes — use `text-foreground font-medium` / `bg-muted` / `hover:underline` instead

---

## 8. Responsive Behavior

**Breakpoints (Tailwind defaults):** `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px

| Element | Mobile | Desktop |
|---------|--------|---------|
| Operator panel sidebar | Hidden (`hidden sm:block`) | Visible cols 9–12 |
| PanelShell widgets | Hidden (`hidden sm:block`) | Sidebar or inline |
| Hero layout | Stacked, identity-first | Split: two-line display name left + widgets right |
| Project blocks | Single column, full-width | Alternating split rows |
| Navigation | Hamburger → `var(--background)` overlay | Horizontal with border-bottom rule |
| Blog post body | Full width, prose capped at 46rem; fixed bottom TOC bar with a bottom sheet | Article + 14rem sticky TOC; prose capped at 46rem |
| Font size | `14px` compact (user default) | `15px` default |

**Touch targets:** minimum `44×44px` for all interactive elements on mobile. **Mobile-first rule:** design both intentionally — do not collapse desktop into mobile.

---

## 9. Agent Prompt Guide

### Quick reference for UI generation

```
Stack: Astro 7 + React 19 + TypeScript + Tailwind CSS 4 + Motion library
Primary font: Geist Sans (all UI + headings, including h2/h3/h4 inside blog prose)
Mono font: Geist Mono (code, terminal output, label-meta strips)
Pixel font: Geist Pixel (decorative counters only, never body or labels)
Serif font: Piazzolla (blog post body prose only — .prose-blog block text)
Dark bg: #0b0b0c | Card: #141416 | Emphasis: #ffffff
Light bg: #f5f3ee | Card: #fefefc  | Emphasis: #000000
Border: rgba(233,232,228,0.10) dark | rgba(16,16,18,0.16) light
Rule:   rgba(233,232,228,0.14) dark | rgba(16,16,18,0.20) light
Radius: 2px base | Body: 15–17px Geist Sans | label-meta: 11px Geist Mono caps
Grid: 12-column, max-width 1240px
```

### Section number convention

Every home section except the hero, and every primary page header, uses `<SectionHeader>`. The hero panel is an `OperatorPanel` with number `01`:

```
01 / IDENTITY    — Hero (OperatorPanel, not SectionHeader)
02 / ABOUT       — About
03 / CONTACT     — Links
04 / PROJECTS    — Projects
05 / EXPERIENCE  — Experience
06 / WRITING     — Blog preview (home)
07 / WRITING     — Blog index
08 / CHANGELOG   — Changelog
09 / SETTINGS    — Settings
10 / PRIVACY     — Privacy
!! / NOT FOUND   — 404
```

### Operator panel prompts

**New content section:**
```
Wrap in <OperatorPanel label="SECTION-NAME" sectionNumber="04">.
Background var(--card), border 1px solid var(--border), border-radius 2px.
No shadow, no traffic lights. Header row label-meta left + titleExt right.
```

**Status output:**
```
Use <BootBlock> lines with "OK ·" / "INFO ·" / "WARN ·" prefixes.
All in var(--muted-foreground), font --font-mono 13px.
No color coding. Keep to 4–6 lines.
```

**Sidebar widget:**
```
Use <PanelShell> with var(--card) background, 1px var(--border) border,
2px radius. Top row: label-meta left, mono 11px muted-foreground-dim right.
Update on 3–10s intervals, not every frame.
```

**Identity display:**
```
Use <InfoTable fieldCodes> inside <OperatorPanel label="WHOIS PO4YKA" sectionNumber="01">.
Key column: --font-mono 11px muted-foreground right-aligned.
Value column: --font-sans 14px foreground left-aligned.
Row separator: border-bottom 1px dashed var(--rule).
```

### Typography guidance

- Use `--font-sans` for everything except code, terminal output, `.label-meta` strips, and `.prose-blog` body paragraphs
- Use `--font-serif` inside `.prose-blog` body text and, via `.display-serif`, on the post title and blog-index titles only. Headings inside the prose stay in `--font-sans` — do not switch the TOC or h2/h3 to serif
- Use `display-name` (`--step-6`, clamp 48–120px, wt 300 given name and 650 family name, tracking -0.035em) for the hero name only; use `display-1` (clamp 40–64px, wt 500, tracking -0.028em) for other page-level identity
- Use `display-2 display-serif` (Piazzolla, clamp 30–44px, wt 560) for blog post titles and blog-index titles; plain `display-2` elsewhere
- Use `h2` (20px, wt 500) for section headings inside `SectionHeader`
- Never use `--font-mono` for prose or headings
- Do not extend `--font-serif` beyond blog prose — no serif on project cards, experience blocks, settings, or any chrome surface

### Motion guidance

Durations and easings come from the tokens in `src/styles/tokens.css`: `--dur-instant` 80ms, `--dur-fast` 150ms, `--dur-base` 240ms, `--dur-slow` 420ms, `--dur-scene` 700ms; `--ease-out`, `--ease-in-out`, `--ease-step-8`, `--ease-step-24`. `src/lib/motion.ts` mirrors them for Motion (`duration`, `ease`), and a unit test keeps the two in sync. Use a token, not a raw number, in new code.

**Rule A1. Motion classes.** Motion is allowed when it carries state. These are the only permitted classes today:
- Enter reveals: opacity fade on first render (`Reveal`)
- Draw-ons for rules, frames and SVG paths
- Scroll-linked progress and reveals, under rule A2. The blog reading progress rail and the per-section TOC line are scroll-linked state. The rail keeps tracking under reduced motion, because it shows position and not decoration. Browsers without scroll timelines use a script that sets the same value
- Hover, press and focus feedback, under rule A3
- Page and shared-element transitions, and the theme wipe (`src/styles/transitions.css`). The root crossfade on a page change is `--dur-base` and the main content fade is 200 ms. The post body slides in at 300 ms. The title of a post morphs from the blog list to the post page at `--dur-base`. A theme change from a visitor control shows a circular wipe at `--dur-base` that grows from that control, or from the viewport centre when the change comes from the keyboard or the terminal. All of these are off under reduced motion. A browser without the View Transitions API navigates and changes theme without animation. The home blog preview has no title morph.

Existing state feedback stays as it is (menu open, form flash, the terminal caret blink and the loading cycle). It is not a new class, and no new loop may use it. All other motion stays banned. A later phase adds a class (text decode, chart transitions, the hero field) only with its own amendment in the PR that first uses it.

**Rule A2. Scroll effects.** Use CSS `animation-timeline` first, behind `@supports (animation-timeline: view())` and `@media (prefers-reduced-motion: no-preference)`, and not under `data-motion="reduce"`, except for a position-state indicator (the blog reading progress rail), which keeps tracking under reduced motion because it shows where the visitor is and not decoration. The default state is the finished, visible state: content, full-page capture, print and no-JS views show the end state, and a rule whose header is 48px or more above the bottom of the viewport is fully drawn. Do not move content to `opacity: 0` and wait for scroll. Scroll-jacking and smooth-scroll libraries stay banned. `Reveal` stays a load-time fade, so below-the-fold content fades at load before the visitor reaches it. The `SectionHeader` rule (`.rule-scroll`, `src/styles/scroll.css`) is the first scroll-linked effect.

**Rule A3. Hover and tap.** Hover, press and focus states (CSS or `whileHover` and `whileTap`) may change opacity, background, underline and outline. They never change width, height, margin, position or scale.

**Rule A9. Weights.** Use weights 400 and 500 for body and chrome, and 600 for emphasis (`.prose-blog strong` is 600; `.display-serif` is Piazzolla 560). The one exception is a variable-weight display moment on the hero name: the `.display-name-given` span at 300 and the `.display-name-family` span at 650 on the `wght` axis of Geist Sans (the `h1` itself stays 500). No other element uses 300 or 650.

Permitted:
- Fade-in stagger on mount (signals list structure, 120–150ms per item) through `Reveal`: an `@starting-style` opacity fade on first render at `--dur-fast`, `--dur-base` or `--dur-slow`, no travel
- Opacity shift on hover (100ms, no color change)
- Underline clip-path animation on links (300ms ease)
- `active:opacity-70` on button press (CSS `:active` pseudo, not Motion whileTap)
- Background colour shift on hover for list rows (to `var(--muted)`)
- Mobile menu height/opacity `AnimatePresence` (functional state change)
- `.form-flash` one-shot outline for invalid form submission (450ms)
- `blink` keyframe on TerminalPrompt caret (focused-input indicator)
- `rule-draw` keyframe on SectionHeader hairline, the panel header hairline (`DrawnRule`) and the active nav-link underline (steps(24) left→right plotter wipe). The SectionHeader rule draws as the header scrolls into view where scroll timelines exist (rule A2), and on load otherwise. Panel rules always draw on load, after their Reveal delay. The nav underline replays on route change
- `loading-cycle` keyframe on `.loading-bracket` (`[ .   ]` → `[ ..  ]` → `[ ... ]` → `[....]` cycle in mono)

Not permitted:
- Parallax, cursor-follow, scroll-velocity tickers
- Color jumps or accent flash on hover
- Blob physics, floating elements, intro animations
- `whileTap` scale / rotate / translate — use `active:opacity-70`
- `whileHover` or `:hover` that changes width, height, margin, position or scale (rule A3) — stick to opacity / background / underline / outline
- Pulse / breathe loops on dots, panels, or atmospheric widgets
- Any keyframe named `shake`, `wobble`, `bounce`, `jiggle`, `float`, `pulse-scale` — hard banned

### SSR guidance

For build-time-static panels (data from synchronous imports like `buildMeta`, `blogData`, `projectsData`):

- **Import directly** — `import { BuildStats } from "./Decorations"`. Do NOT wrap in `React.lazy()`.
- **Do NOT wrap in `<Suspense fallback={null}>`** — the component is synchronous.
- Result: Astro SSRs the panel's content into the initial HTML response, no FOUC, no lazy chunk request.

For async-data panels (fetch `/api/*` or read `navigator.*` / `performance.*`):

- **Keep lazy-loaded** — `const X = lazy(() => import("./Decorations").then(m => ({ default: m.X })))`.
- Wrap in `<Suspense fallback={null}>`.
- These panels hydrate on the client when their parent island becomes visible.

Admin SPA: `/admin/*` uses a catch-all Astro route that mounts React manually via `<script>import "@/admin/mount"</script>`. Because there's no Astro `client:*` island on that page, the React-Refresh preamble is injected manually in `src/pages/admin/[...path].astro` under `{isDev && (<script type="module" is:inline …>)}`. Do not remove it — admin will go blank in dev otherwise.

### Design quality checklist

Before finalizing any UI output, verify:
- [ ] Feels like a real developer's site — not a generic AI portfolio
- [ ] No gradient backgrounds, no pill buttons, no shadows on flat panels
- [ ] No chromatic accent — emphasis only via weight and `--emphasis` white/black
- [ ] Numbered `SectionHeader` present on every major section
- [ ] Terminal output contains real mobile dev tool names
- [ ] WCAG AA contrast on all functional text
- [ ] Reduced motion respected on all animations
- [ ] One decorative signature per viewport; no two decorative blocks adjacent (rule A11)
- [ ] Mobile layout is intentionally designed, not a collapsed desktop
- [ ] Press feedback via `active:opacity-70`, not `whileTap` scale/rotate
- [ ] Status dots, online indicators, traffic-light analogues: static — no pulse loops
- [ ] No hover or tap state that changes width, height, margin, position or scale (rule A3)
- [ ] If the widget has no real data source, it does not exist

---

## 10. Deleted Inventory

The following components were removed during the Swiss refactor and its follow-up passes. They are **not available for import** and must not be reconstructed:

| Component | Removed in | Reason |
|---|---|---|
| `TrafficLights` | `a0146f7` | macOS window theatre — replaced by flat hairline header |
| `UptimeStrip` | `e42eccc` → `a0146f7` | Fake uptime/load/tasks ticker |
| `CpuMonitor`, `MemoryPanel`, `DiskBars` | `6c11ea7` | Seeded-RNG fake system metrics |
| `MemoryGrid` | `6c11ea7` | Thin wrapper over `MemoryPanel` |
| `ProcessTable` | `6c11ea7` | Hardcoded process list + synth CPU/mem |
| `NetworkGraph` | `6c11ea7` | Scroll-velocity sparkline dressed as "network I/O" |
| `SystemBottomBar` | `6c11ea7` | Composite of three deleted widgets |
| `FastlaneDeploy` | `6c11ea7` | Fabricated CI lane output with invented test counts |
| `GitLog` (in `MobileTerminal/ci.tsx`) | `6c11ea7` | Hardcoded commit list |
| `LanguagePanel` | _dead-code purge_ | Exported but rendered nowhere; duplicated `OpenSourcePanel` surface |
| `ConnectionPanel` | _dead-code purge_ | Exported but rendered nowhere; browser-network sparkline |
| `VisitorContext` | redesign Phase 2 | Never imported; browser/device state panel |
| `activitySensor`, `activityStore` | redesign Phase 2 | Activity tracker store with no reader |
| `MacWindow`, `Accent` | redesign Phase 2 | Renamed to `OperatorPanel` and `Em`; no compat aliases |
| `TechTagHeatmap` | _dead-code purge_ | Exported but rendered nowhere |
| `ProjectPlatformMatrix` | _dead-code purge_ | Exported but rendered nowhere; project×platform matrix |
| `StackHeatmap` | _follow-up_ | Low-information dot-matrix — a 10×68 grid the reader can't parse at a glance |
| `BlogStatsPanel` | _editorial pass_ | Statistics about the site itself (post counts, minutes of reading) under a two-post blog: self-referential, and it emphasised how little was there |

Real-data equivalents that cover every functional use-case:

| Need | Use |
|---|---|
| Recent commits | `RealGitLog` (GitHub API) |
| Repo inventory | `OpenSourcePanel` (GitHub API) |
| Activity heatmap | `ActivityCalendar` + `ActivitySparkline` (GitHub events) |
| Build metadata | `BuildStats` (from `buildMeta.ts`) |
| Latest post | `LatestPostPanel` (from `blogData`) |
| Latest release | `LatestReleasePanel` (GitHub API) |

If a new widget need appears and there is no real data source for it, **do not render a fake one** — leave the slot empty or add a real data source first.
