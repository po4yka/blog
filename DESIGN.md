# Design System — po4yka.dev

## 1. Visual Theme & Atmosphere

The site is a **Ghostty terminal workstation** — a well-configured developer environment, not a startup landing page. The metaphor is literal: the primary design unit is a macOS terminal window with chrome, traffic lights, and monospace output. This is where content lives, not floating on a blank canvas.

The palette is Catppuccin Mocha for dark mode (the default) and a soft lavender-tinted editorial surface for light. Both share a single chromatic accent: muted purple (`#9184f7` dark / `#7c6cf5` light). Everything else is neutral. There are no gradients, no neon, no glassmorphism excess.

Typography is monospace-first. JetBrains Mono carries all headings, UI labels, metadata, and terminal output. Inter is available for long-form blog prose where extended reading comfort matters. The hierarchy is built from opacity and size, not font switching. The result feels precise and technical without being cold.

**Key characteristics:**
- Catppuccin Mocha canvas (`#191a21`) as the default dark background
- Single accent family: muted purple — used sparingly for links, active states, key highlights; phosphor glow (`text-shadow: var(--phosphor-glow)`) at rest via `.accent-glow`
- JetBrains Mono as the primary type voice; Inter as a secondary reading font only
- macOS window chrome (MacWindow component) as the primary content container
- Subtle CRT atmosphere layer: 2px scanlines at 3% opacity, SVG noise grain at 1.5%, radial vignette — perceptible on inspection, invisible during normal reading
- Density-first content inside MacWindow: IBM 3270 field codes, tree-branch lists, ranked indexes — terminals deliver information, not prose
- Zero gradients, zero shadows on flat surfaces, no pill-shaped buttons
- All motion is calm and purposeful — staggered reveals, line-draw hovers, no floating blobs

---

## 2. Color Palette & Roles

### Dark Theme (default — Ghostty / Catppuccin Mocha)

| Token | Hex | Role |
|-------|-----|------|
| `--background` | `#191a21` | Page canvas — deep navy-charcoal |
| `--card` | `#24273a` | Elevated surfaces — MacWindow bodies, panels |
| `--secondary` | `#1e2030` | Sidebar, input backgrounds, nested containers |
| `--muted` | `#232637` | Subtle containment, hover state fills |
| `--titlebar` | `#2a2d3d` | MacWindow titlebar strip |
| `--foreground` | `#cdd6f4` | Primary text — Catppuccin text |
| `--muted-foreground` | `#6c7086` | Tertiary text, decorative window labels |
| `--accent` | `#9184f7` | The only chromatic color — links, active nav, highlights |
| `--border` | `rgba(205,214,244,0.07)` | Hairline separators, window edges |
| `--titlebar-border` | `rgba(205,214,244,0.05)` | MacWindow header bottom border |
| `--panel-bg` | `rgba(36,39,58,0.45)` | PanelShell glass surface |
| `--nav-glass` | `rgba(25,26,33,0.82)` | Sticky nav background |
| `--dot-dim` | `rgba(205,214,244,0.08)` | Inactive traffic light dots |
| `--signal-green` | `#a6e3a1` | OK status, build success, `[  OK  ]` prefix |
| `--signal-amber` | `#f9e2af` | Warnings, `[ WARN ]` prefix |
| `--signal-red` | `#f38ba8` | Errors, destructive actions |
| `--info` | `#89b4fa` | Info lines, `[ INFO ]` prefix |
| `--window-shadow` | `0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)` | MacWindow elevation |
| `--window-shadow-sm` | `0 4px 16px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.15)` | Smaller floating elements |

### Light Theme (editorial / macOS-light)

| Token | Hex | Role |
|-------|-----|------|
| `--background` | `#f6f5f8` | Soft lavender-tinted white canvas |
| `--card` | `#ffffff` | Elevated surfaces |
| `--secondary` | `#eceaf0` | Secondary backgrounds |
| `--muted` | `#eae8ee` | Subtle fills |
| `--titlebar` | `#edebf1` | MacWindow titlebar |
| `--foreground` | `#1c1b22` | Primary text — deep graphite |
| `--muted-foreground` | `#78758a` | Tertiary text |
| `--accent` | `#7c6cf5` | Same purple family, slightly deeper for contrast |
| `--border` | `rgba(28,27,34,0.09)` | Hairline separators |
| `--signal-green` | `#40a845` | OK status |
| `--signal-amber` | `#c09a1a` | Warnings |
| `--signal-red` | `#d94058` | Errors |
| `--info` | `#3574d4` | Info lines |

### Accent Usage Rule

The purple accent is **one family, used sparingly**. Overuse dilutes it. Acceptable uses:
- Active navigation link
- Inline text link (underline on hover via line-draw animation)
- Key highlight or emphasis moment
- Focus ring: `--ring` = `rgba(145,132,247,0.25)` dark / `rgba(124,108,245,0.25)` light

Never use multiple accent colors competing at once. No teal, no orange, no red as accent.

---

## 3. Typography Rules

### Font Families

- **Primary (headings, UI, labels, terminal output):** `'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Monaco', 'Courier New', monospace`
- **Secondary (blog prose only):** `'Inter', system-ui, -apple-system, sans-serif`

### Custom Size Scale

| Class | Size | Use |
|-------|------|-----|
| `text-2xs` | 8px | Decorative window chrome labels only |
| `text-3xs` | 9px | Ambient status indicators |
| `text-xs` | 10px | Smallest metadata |
| `text-label` | 11px | Tags, platform badges |
| `text-mono-sm` | 12px | Secondary terminal output, captions |
| `text-mono` | 13px | Standard UI text, body, nav links |
| `text-mono-lg` | 15px | Emphasized UI, subheadings |
| `h4` | 14px (0.875rem) | Minor section label |
| `h3` | 16px (1rem) | Section label |
| `h2` | 18px (1.125rem) | Section heading |
| `h1` | 24px (1.5rem) | Page-level heading |

### Hierarchy Rules

- **JetBrains Mono for everything** except long-form blog content. Use opacity to create depth within a monospace system — do not switch fonts for visual hierarchy.
- **Opacity layers:** primary text at full opacity, secondary at `/70`, tertiary at `/50`, decorative at `/25`–`/35`
- **Weight:** `400` (normal) for body and headings, `500` (medium) for emphasis. No bold except semantic HTML.
- **Line height:** `1.4` for headings, `1.6`–`1.8` for body prose, `1.5` for UI labels
- **Base font size:** `15px` (user-configurable: 14px compact / 15px default / 17px large)
- User font-size preference is stored in `settingsStore` and applied via `--font-size` CSS variable

---

## 4. Component Stylings

### Terminal Kit — Primary Design System

These are the project's equivalent of cards and panels. Use them instead of generic `div` containers.

**MacWindow**
- Background: `var(--card)` — `#24273a` dark / `#ffffff` light
- Titlebar: `var(--titlebar)`, border-bottom `1px solid var(--titlebar-border)`
- Traffic lights: 12px circles, `gap-2`, colors `#ff5f57` / `#febc2e` / `#28c840`; inactive state uses `var(--dot-dim)`
- Radius: `10px` (`var(--radius)`)
- Shadow: `var(--window-shadow)`
- Title text: `text-mono-sm` JetBrains Mono, `var(--muted-foreground)` at `/60`

**PanelShell**
- Background: `var(--panel-bg)` — glass surface with blur when layered
- Border: `1px solid var(--border)`
- Radius: `6px`
- Used for: CPU monitors, network graphs, compact system widgets
- Content font: `text-mono-sm` or `text-2xs`/`text-3xs` for decorative labels

**BootBlock**
- Lines prefixed with `[  OK  ]` in `var(--signal-green)`, `[ INFO ]` in `var(--info)`, `[ WARN ]` in `var(--signal-amber)`
- Background: none — sits on page or inside MacWindow
- Font: `text-mono` JetBrains Mono
- Keep to 4–6 lines maximum; do not use as filler

**Cmd**
- Renders `$ command` prompt line
- Prompt `$`: `var(--accent)` at `/70`
- Command text: `var(--foreground)` at `/80`
- Font: `text-mono` JetBrains Mono
- Used to introduce content sections (acts as a section label)

**OutputBlock**
- Indented output wrapper with fade-in / stagger animation
- Left border: `2px solid var(--border)` or `var(--accent)` at `/20`
- Padding-left: `1rem`
- Font: `text-mono-sm` at `/70`

**InfoTable**
- Two-column key-value table for `whois`-style structured data
- Key column: `text-mono-sm`, `var(--muted-foreground)` — right-aligned
- Value column: `text-mono`, `var(--foreground)` — left-aligned
- Row separator: `var(--border)` hairline
- Used in hero for identity display

### Buttons

**Primary**
- Background: `var(--accent)` at `/10`–`/15`
- Text: `var(--accent)`
- Border: `1px solid var(--accent)` at `/30`
- Radius: `var(--radius)` = `10px`
- Hover: background lifts to `var(--accent)` at `/20`

**Secondary**
- Background: `var(--secondary)`
- Text: `var(--foreground)` at `/80`
- Border: `1px solid var(--border)`
- Radius: `10px`

**Ghost / Inline**
- No background, no border
- Text: `var(--muted-foreground)`
- Hover: text lifts to `var(--foreground)`

No pill-shaped buttons (9999px radius). No gradient buttons. No oversized CTAs.

### Navigation

- Sticky nav: `var(--nav-glass)` backdrop-blur background
- Links: `text-mono` JetBrains Mono, `var(--foreground)` at `/60`
- Active link: `var(--accent)` — the only accent use in nav
- Mobile: `var(--mobile-menu-bg)` overlay

### Tags / Platform Badges

- Background: `var(--muted)`
- Text: `var(--muted-foreground)`
- Font: `text-label` (11px) JetBrains Mono
- Radius: `4px` — not pill-shaped
- Use sparingly for: Android, iOS, KMP, MobileOps, CI/CD, blog categories, dates

### Blog List Items

- Hover interaction: line-draw underline via `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)`
- Underline color: `var(--accent)` at `/60`
- Transition: `0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- No card containers for blog lists — editorial rows only

---

## 5. Layout Principles

- **Max content width:** `1080px`
- **Base radius:** `10px` with scale: `sm` = 5px, `md` = 7.5px, `lg` = 10px, `xl` = 15px
- **Decorative section budget:** Maximum 6–8 MobileTerminal blocks on the homepage. Each must relate to a real mobile dev tool (adb, gradle, xcode, fastlane, git). Never stack two decorative blocks without a content section between them.
- **Asymmetric over symmetric:** Prefer slightly editorial, off-center compositions over templated centering. Vary layout across sections while keeping the same design language.
- **Whitespace:** Generous. Terminal blocks need breathing room between them. Never pack sections tightly.

**Good layout patterns:**
- Split hero: whois table + decorative sidebar (desktop only)
- Alternating project rows with varying alignment
- Timeline-style experience blocks
- Editorial stacked blog list with strong metadata

**Avoid:**
- Three equal cards in a row as the default
- Identical section structure repeated throughout
- Full-width background fills on every section
- Decorative blocks hidden behind content

---

## 6. Depth & Elevation

Depth is created through **background color shifts**, **border hairlines**, and **shadows on window chrome** — not on flat cards.

| Surface | Treatment |
|---------|-----------|
| Page canvas | `var(--background)` — no shadow |
| MacWindow | `var(--card)` + `var(--window-shadow)` |
| PanelShell | `var(--panel-bg)` glass + `var(--border)` |
| Sticky nav | `var(--nav-glass)` backdrop-blur |
| Nested containers | `var(--secondary)` or `var(--muted)` — no shadow |
| Island skeletons | `.skeleton` shimmer from `var(--secondary)` → `var(--muted)` |

**Zero shadows on:** inline tags, buttons, flat panels, blog list items, footer.

---

## 7. Do's and Don'ts

### Do
- Use MacWindow chrome as the primary content framing unit
- Build type hierarchy through opacity within JetBrains Mono — not font switching
- Use the purple accent on exactly one thing per visual region
- Keep terminal output lines realistic — real mobile dev tools: `adb`, `gradle`, `xcode`, `fastlane`, `git`, `ktlint`
- Hide excess decoration on mobile (`hidden sm:block`) to keep content scannable
- Use line-draw animations for hover states (clip-path, not underline CSS)
- Respect `prefers-reduced-motion` — all Motion library animations must check it
- Add scanlines at ≤ 4% opacity via CSS pseudo-element — subtle phosphor texture, not visible gimmick
- Apply phosphor glow on accent text: `text-shadow: 0 0 8px rgba(145,132,247,0.25)` dark / `rgba(124,108,245,0.18)` light
- Use tree-branch unicode (`├──` `└──` `│`) inside MacWindow list content for terminal density
- Use IBM 3270-style field codes (`[01] KEY ......: value`) in InfoTable for dense data display
- Use vim-style status bar and line numbers as opt-in MacWindow props for high-density sections

### Don't
- No gradient backgrounds or buttons
- No neon or oversaturated tones (phosphor glow alpha must stay ≤ 0.35)
- No glassmorphism on primary content (only on nav and panel widgets)
- No pill-shaped buttons or pill-shaped container radii
- No generic SaaS card grids
- No fake metrics or KPI cards presented as real data
- No centered hero with gradient blob
- No "crafting digital experiences" copy — write like a real mobile engineer
- No Matrix/hacker aesthetic — no green-on-black, no code rain, no retro CRT bezels
- No more than 6–8 decorative sections on a single page
- No scanlines thick enough to read as decoration (> 4% opacity crosses the line)
- No ASCII art characters or illustrations — box-drawing frames and labels are fine, character art is not
- No stacking two decorative blocks back-to-back

---

## 8. Responsive Behavior

**Breakpoints (Tailwind defaults):** `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px

| Element | Mobile | Desktop |
|---------|--------|---------|
| MacWindow decorative sidebar | Hidden (`hidden sm:block`) | Visible alongside content |
| PanelShell widgets | Hidden (`hidden sm:block`) | Sidebar or inline |
| Hero layout | Stacked, identity-first | Split: whois left + widgets right |
| Project blocks | Single column, full-width | Alternating split rows |
| Navigation | Hamburger → `var(--mobile-menu-bg)` overlay | Horizontal with glass background |
| Font size | `14px` compact (user default) | `15px` default |

**Touch targets:** minimum `44×44px` for all interactive elements on mobile.  
**Mobile-first rule:** do not collapse desktop into mobile — design both intentionally.

---

## 9. Agent Prompt Guide

### Quick reference for UI generation

```
Stack: Astro 6 + React 19 + TypeScript + Tailwind CSS 4 + Motion library
Primary font: JetBrains Mono (all UI) | Secondary: Inter (blog prose only)
Dark bg: #191a21 | Card: #24273a | Accent: #9184f7
Light bg: #f6f5f8 | Card: #ffffff  | Accent: #7c6cf5
Border: rgba(205,214,244,0.07) dark | rgba(28,27,34,0.09) light
Radius: 10px base | Font size: text-mono (13px) for UI, text-mono-lg (15px) for emphasis
```

### Terminal component prompts

**New content section:**
```
Wrap in <MacWindow title="$ command-name"> with a <Cmd> line above it.
Background var(--card), titlebar var(--titlebar), shadow var(--window-shadow).
```

**Status output:**
```
Use <BootBlock> lines with [  OK  ] in var(--signal-green),
[ INFO ] in var(--info), [ WARN ] in var(--signal-amber).
Keep to 4–6 lines. Font text-mono JetBrains Mono.
```

**Atmospheric widget (sidebar only):**
```
Use <PanelShell> with var(--panel-bg) background, 1px var(--border) border,
6px radius. Labels at text-2xs or text-3xs, var(--muted-foreground) at /30.
Update on 3–10s intervals, not every frame.
```

**Identity display:**
```
Use <InfoTable> inside <MacWindow title="$ whois po4yka">.
Key column: text-mono-sm muted-foreground right-aligned.
Value column: text-mono foreground left-aligned.
```

### Design quality checklist

Before finalizing any UI output, verify:
- [ ] Feels like a real developer's site — not a generic AI portfolio
- [ ] No gradient backgrounds, no pill buttons, no glassmorphism on content
- [ ] Purple accent used on at most one focal point per region
- [ ] Terminal output contains real mobile dev tool names
- [ ] WCAG AA contrast on all functional text
- [ ] Reduced motion respected on all animations
- [ ] Decorative terminal blocks do not exceed 6–8 on a single page
- [ ] Mobile layout is intentionally designed, not a collapsed desktop
