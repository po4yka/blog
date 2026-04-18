# Design System — po4yka.dev

## 1. Visual Theme & Atmosphere

The site is a **Swiss / International Typographic Style surface fused with an operator-console industrial layer** — a well-configured developer workstation, not a startup landing page. The terminal metaphor is kept: `$` prompts, boot blocks, tree branches, IBM 3270 field codes, numbered section labels. What is stripped is the macOS window theatre: no traffic lights, no drop shadows on flat panels, no chromatic accent color.

The palette is neutral greyscale. Dark mode defaults to a near-black graphite canvas (`#0b0b0c`) with eggshell text (`#e9e8e4`). Light mode is warm paper (`#f5f3ee`) with ink (`#101012`). Emphasis is pure white on dark, pure black on light — weight and rule weight do the work that color used to do.

Typography leads with **Geist Sans** for all headings, body, navigation, and UI labels. **Geist Mono** is demoted to code, terminal output, and metadata strips. The result is technical without being cold, and readable without sacrificing identity.

**Key characteristics:**
- Near-black graphite canvas (`#0b0b0c` dark) / warm paper (`#f5f3ee` light)
- No chromatic accent. Emphasis = `--emphasis` (pure white dark / pure black light) + weight + underline
- Geist Sans as the primary type voice; Geist Mono for code and operator labels only
- Flat operator panels: `1px solid var(--border)`, `2px border-radius`, no shadow, no window chrome
- Numbered section system: every section opens with `SectionHeader` — `01 / IDENTITY`, `02 / ABOUT`, `03 / CONTACT`, `04 / PROJECTS`, `05 / EXPERIENCE`, `06 / WRITING`
- Hairline rules as structural dividers — `var(--rule)` token
- Near-zero decorative motion: fade-in stagger on mount, opacity shift on hover, nothing else
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
| `--muted-foreground-dim` | `#7c7c82` | Tertiary labels — 4.9:1 on bg |
| `--border` | `rgba(233,232,228,0.10)` | Panel edges, hairline separators |
| `--rule` | `rgba(233,232,228,0.14)` | Section divider rules |
| `--emphasis` | `#ffffff` | Full-luminance emphasis, focus rings |
| `--code-bg` | `#16161a` | Code block backgrounds |
| `--destructive` | `#e8634b` | Destructive actions only |

### Light Theme (warm paper + ink)

| Token | Value | Role |
|-------|-------|------|
| `--background` | `#f5f3ee` | Warm paper canvas |
| `--foreground` | `#101012` | Primary text — ink |
| `--card` | `#ffffff` | Section panels |
| `--secondary` | `#ebe8e2` | Nested containers |
| `--muted` | `#dedcd5` | Subtle fills |
| `--muted-foreground` | `#4a4a50` | Secondary labels — 8.5:1 on bg |
| `--muted-foreground-dim` | `#6a6a70` | Tertiary labels — 5.0:1 on bg |
| `--border` | `rgba(16,16,18,0.10)` | Panel edges |
| `--rule` | `rgba(16,16,18,0.14)` | Section divider rules |
| `--emphasis` | `#000000` | Full-luminance emphasis, focus rings |
| `--code-bg` | `#eeebe4` | Code block backgrounds |
| `--destructive` | `#b83a28` | Destructive actions only |

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
```

- **`--font-sans`** — all headings, body, navigation, labels, button text, UI copy
- **`--font-mono`** — code blocks, terminal output (`Cmd`, `BootBlock`, `InfoTable`), `.label-meta` metadata strips
- **`--font-pixel`** — decorative counters and numbered section prefixes only; maximum 6 uses per page

Fira Code is an optional fallback in the mono stack for code blocks where programming ligatures help. Do not ship it unless ligatures are intentionally enabled.

### Type Scale

| Class | Size | Weight | Tracking | Use |
|-------|------|--------|----------|-----|
| `display-1` | clamp(40px–64px) | 500 | -0.028em | Hero name, page-level identity |
| `display-2` | clamp(28px–40px) | 500 | -0.020em | Post titles, major section heads |
| `h1` | clamp(28px–36px) | 500 | -0.015em | Page headings |
| `h2` | 20px | 500 | -0.010em | Section headings |
| `h3` | 17px | 500 | 0 | Sub-section headings |
| `h4` | 15px | 500 | 0 | Minor labels |
| body | 15–17px | 400 | 0 | UI copy, navigation |
| `label-meta` | 11px mono, uppercase | 400 | 0.12em | Metadata strips, section number labels |

All headings use `--font-sans`. `label-meta` uses `--font-mono`. Blog post prose uses `--font-sans` at 17px, line-height 1.7, max-width 40rem (~62ch with Geist Sans).

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

**MacWindow (operator panel mode)**
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
- Used for: sidebar widgets, compact system panels (CPU, network, build stats)

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
- Row 3: `border-bottom: 1px solid var(--rule)`
- Applied to every home section and primary page header

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

No pill-shaped buttons (9999px radius). No gradient buttons. No oversized CTAs.

### Navigation

- Sticky nav: `var(--background)` with `border-bottom: 1px solid var(--border)`
- Links: Geist Sans 14px, `var(--foreground)` at `/60`
- Active link: `var(--emphasis)` weight 500 with 1px underline rule — no color jump
- Mobile: overlay with `var(--background)` fill

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

- **Max content width:** `1160px` via `.page-grid`
- **Grid:** 12-column CSS grid, `gap: 1.5rem`, `padding: 0 clamp(1.25rem, 2vw + 0.5rem, 3rem)`
- **Base radius:** `2px` — sharp, Swiss-derived; no soft rounded corners on panels
- **Decorative section budget:** Maximum 6–8 atmospheric blocks on the homepage. Each must relate to a real mobile dev tool (adb, gradle, xcode, fastlane, git, ktlint). Never stack two without a content section between them.
- **Asymmetric over symmetric:** editorial, off-center compositions. Vary section layout while keeping the same design language.
- **Whitespace:** generous. Panels need breathing room. Never pack sections tightly.

**Grid column assignments:**
- Hero: name + subtitle cols 1–8, technical sidebar cols 9–12
- Blog post body: cols 2–8 (asymmetric, shifted right of center)
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

---

## 6. Depth & Elevation

Depth comes from **background tone shifts** and **hairline borders** — not shadows.

| Surface | Treatment |
|---------|-----------|
| Page canvas | `var(--background)` — no shadow, no border |
| Operator panel (MacWindow) | `var(--card)` + `1px solid var(--border)` |
| PanelShell widget | `var(--card)` + `1px solid var(--border)` |
| Sticky nav | `var(--background)` + `border-bottom: 1px solid var(--border)` |
| Nested containers | `var(--muted)` — no shadow |
| Island skeletons | shimmer from `var(--muted)` → `var(--secondary)` |

**Zero shadows on:** panels, buttons, tags, blog list items, footer, any flat surface. Shadows are reserved for floating overlays (dialogs, dropdowns) only.

---

## 7. Do's and Don'ts

### Do
- Use operator panels (`MacWindow` in flat mode, `PanelShell`) as the primary content framing unit
- Use `SectionHeader` with numbered labels (`01 / IDENTITY`) at the top of every major section
- Build hierarchy through weight (400→500), opacity layers, and hairline rules — not color
- Keep terminal output realistic — real mobile dev tools: `adb`, `gradle`, `xcode`, `fastlane`, `git`, `ktlint`
- Hide excess decoration on mobile (`hidden sm:block`) to keep content scannable
- Use underline-on-hover via `clip-path` animation — not color jumps
- Respect `prefers-reduced-motion` — all Motion library animations must check it
- Use tree-branch unicode (`├──` `└──` `│`) inside panel list content for terminal density
- Use IBM 3270-style field codes (`[01] KEY ......: value`) in InfoTable for dense data display
- Use `.label-meta` (mono 11px uppercase letter-spaced) for all metadata strips and section number prefixes
- Use `font-variant-numeric: tabular-nums` on all numeric data

### Don't
- No chromatic accent colors — no purple, no teal, no amber as accent
- No gradient backgrounds or buttons
- No drop shadows on flat panels or cards
- No glassmorphism on any surface
- No pill-shaped buttons or container radii beyond 2px
- No generic SaaS card grids
- No fake metrics or KPI cards presented as real data
- No Matrix/hacker aesthetic — no green-on-black, no code rain, no CRT bezels
- No phosphor glow, no scanlines, no cursor-glow, no parallax
- No more than 6–8 atmospheric sections on a single page
- No stacking two decorative blocks back-to-back
- No ASCII art illustrations — box-drawing characters for structure are fine; character art is not
- No `--font-mono` for body text or headings — monospace is demoted to code and operator labels only

---

## 8. Responsive Behavior

**Breakpoints (Tailwind defaults):** `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px

| Element | Mobile | Desktop |
|---------|--------|---------|
| Operator panel sidebar | Hidden (`hidden sm:block`) | Visible cols 9–12 |
| PanelShell widgets | Hidden (`hidden sm:block`) | Sidebar or inline |
| Hero layout | Stacked, identity-first | Split: display-1 name left + widgets right |
| Project blocks | Single column, full-width | Alternating split rows |
| Navigation | Hamburger → `var(--background)` overlay | Horizontal with border-bottom rule |
| Blog post body | Full width | cols 2–8 of 12 (capped at 40rem) |
| Font size | `14px` compact (user default) | `15px` default |

**Touch targets:** minimum `44×44px` for all interactive elements on mobile.
**Mobile-first rule:** design both intentionally — do not collapse desktop into mobile.

---

## 9. Agent Prompt Guide

### Quick reference for UI generation

```
Stack: Astro 6 + React 19 + TypeScript + Tailwind CSS 4 + Motion library
Primary font: Geist Sans (all UI + headings + body)
Mono font: Geist Mono (code, terminal output, label-meta strips)
Pixel font: Geist Pixel (decorative counters only, ≤6 uses/page)
Dark bg: #0b0b0c | Card: #141416 | Emphasis: #ffffff
Light bg: #f5f3ee | Card: #ffffff  | Emphasis: #000000
Border: rgba(233,232,228,0.10) dark | rgba(16,16,18,0.10) light
Rule:   rgba(233,232,228,0.14) dark | rgba(16,16,18,0.14) light
Radius: 2px base | Body: 15–17px Geist Sans | label-meta: 11px Geist Mono caps
Grid: 12-column, max-width 1160px
```

### Section number convention

Every home section and primary page header uses `<SectionHeader>`:

```
01 / IDENTITY    — Hero
02 / ABOUT       — About
03 / CONTACT     — Links
04 / PROJECTS    — Projects
05 / EXPERIENCE  — Experience
06 / WRITING     — Blog preview / blog index
```

### Operator panel prompts

**New content section:**
```
Wrap in <MacWindow label="SECTION-NAME" sectionNumber="04">.
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
Use <InfoTable fieldCodes> inside <MacWindow label="WHOIS PO4YKA" sectionNumber="01">.
Key column: --font-mono 11px muted-foreground right-aligned.
Value column: --font-sans 14px foreground left-aligned.
Row separator: border-bottom 1px dashed var(--rule).
```

### Typography guidance

- Use `--font-sans` for everything except code, terminal output, and `.label-meta` strips
- Use `display-1` (clamp 40–64px, wt 500, tracking -0.028em) for the hero name only
- Use `display-2` (clamp 28–40px, wt 500, tracking -0.020em) for blog post titles
- Use `h2` (20px, wt 500) for section headings inside `SectionHeader`
- Never use `--font-mono` for prose or headings

### Motion guidance

Permitted:
- Fade-in stagger on mount (signals list structure, 120–150ms per item)
- Opacity shift on hover (100ms, no color change)
- Underline clip-path animation on links (300ms ease)

Not permitted:
- Parallax, cursor-follow, scroll-velocity tickers
- Color jumps or accent flash on hover
- Blob physics, floating elements, intro animations

### Design quality checklist

Before finalizing any UI output, verify:
- [ ] Feels like a real developer's site — not a generic AI portfolio
- [ ] No gradient backgrounds, no pill buttons, no shadows on flat panels
- [ ] No chromatic accent — emphasis only via weight and `--emphasis` white/black
- [ ] Numbered `SectionHeader` present on every major section
- [ ] Terminal output contains real mobile dev tool names
- [ ] WCAG AA contrast on all functional text
- [ ] Reduced motion respected on all animations
- [ ] Atmospheric terminal blocks do not exceed 6–8 on a single page
- [ ] Mobile layout is intentionally designed, not a collapsed desktop
