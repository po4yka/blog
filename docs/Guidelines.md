# Guidelines

This project is a personal website for **@po4yka / Nikita Pochaev**.

The website should function as a **minimalistic resume site**, **developer portfolio**, **apps showcase**, and **technical blog** in one coherent experience.

It must feel like a real, authored, high-taste website for a mobile engineer — **not** like an AI-generated portfolio template or startup landing page.

---

# Core project intent

The site should communicate the following clearly:

- Nikita Pochaev is an **AI Engineer & Senior Mobile Developer**
- Main focus: **Android**, **Kotlin Multiplatform**, **MobileOps**, **AI/ML integration**
- The site should showcase:
  - selected apps and projects
  - links to **GitHub**
  - links to **Google Play**
  - links to **App Store**
  - a separate **blog / writing** section
- The overall impression should be:
  - thoughtful
  - minimal
  - technical
  - precise
  - modern
  - credible
  - memorable without being loud

The site should not feel corporate, over-marketed, gimmicky, or visually overdesigned.

---

# General guidelines

- Prefer **clarity, hierarchy, and authorship** over decoration.
- Every section should have a clear purpose.
- Use **responsive layouts** by default.
- Prefer **grid and flex layouts** over unnecessary absolute positioning.
- Keep the structure modular and reusable.
- Keep code and layout clean and easy to extend.
- Use a small number of reusable components with consistent spacing and behavior.
- Avoid adding sections just to “fill” the page. Decorative terminal blocks serve as rhythm dividers, not standalone content.
- **Decorative section budget:** Maximum 6-8 decorative terminal blocks on the homepage. Each must relate to mobile engineering tools. Quality over quantity.
- Avoid fake product UI, fake metrics presented as real data, fake testimonials, or meaningless visual fillers. (Atmospheric terminal widgets are permitted -- see Anti-AI-slop rules.)
- Do not generate generic startup copy or vague marketing language.
- Prefer fewer, better-designed elements over many average ones.
- Keep visual noise low.
- The website must feel believable as a real developer’s site.

---

# Anti-AI-slop rules

The website must **not** look like a generic AI-generated portfolio.

## Never do this

- no generic centered hero with a gradient blob
- no cliche “building digital experiences” copy
- no meaningless KPI cards presented as real data
- no generic SaaS landing page sections
- no overuse of glassmorphism
- no excessive glow or neon styling
- no giant soft pill radii everywhere
- no random floating chips and decorative tags
- no repeated equal-sized cards for every section
- no empty “premium” look without substance
- no overcomplicated visuals that distract from content
- no exaggerated visual trends unless they support the concept
- no generic hacker/Matrix theme -- terminal aesthetic must feel like a real developer's environment

## Atmospheric terminal widgets

Decorative system widgets (CPU monitor, network graph, build output, process tables) are permitted when:

- They serve the terminal workstation metaphor and are clearly atmospheric, not presented as real metrics
- They relate to mobile engineering tools (adb, gradle, xcode, fastlane, git)
- They remain secondary to actual content (smaller, dimmer, sidebar placement)
- They do not exceed the decorative section budget (see Layout guidelines)

This is distinct from “fake dashboard visuals” which are dishonest KPI cards or metrics designed to impress. Atmospheric widgets are ambient decoration like wallpaper in a terminal emulator.

## Always prefer this instead

- clear authorship
- strong typography
- real structure
- restrained palette
- intentional composition
- visible content hierarchy
- credible developer-oriented details
- real project framing
- specific, human-sounding copy
- interesting layout choices that still feel usable

---

# Brand and tone guidelines

The brand tone should feel like a **product-minded engineer with design taste**.

The voice should be:

- calm
- concise
- precise
- modern
- human
- technically confident
- understated

Avoid sounding like:

- a SaaS landing page
- a design agency template
- a motivational personal brand page
- a generic AI summary of a developer profile

Copy should feel as if it was written by a real mobile engineer.

---

# Visual direction

Use a **Swiss / International Typographic Style surface fused with an operator-console industrial layer**.

The visual language combines Swiss grid discipline and neutral greyscale with the information density of a developer's terminal session. It should feel like a well-configured operator workstation, not a startup landing page and not a retro terminal emulator.

The visual language combines:

- terminal authenticity (real CLI patterns, not decorative approximations)
- Geist Sans as the primary type voice; Geist Mono demoted to code and operator labels; Piazzolla (variable serif with Cyrillic) carries blog post body prose
- neutral greyscale palette — dark graphite (`#0b0b0c`) / warm paper (`#f5f3ee`)
- numbered section labels (`01 / IDENTITY`, `04 / PROJECTS`) with hairline dividers
- calm whitespace between operator panels
- near-zero decorative motion; fade-in on mount and opacity shift on hover only
- atmospheric system widgets that reinforce the workstation feel

The terminal metaphor must stay grounded and credible:

- Do not turn the website into a retro gimmick, sci-fi concept, or generic hacker/Matrix theme.
- Terminal output should resemble real developer tools (adb, gradle, xcode, fastlane, git, ktlint) -- not fictional commands.
- The aesthetic should feel like a real mobile engineer's environment.

## Terminal density and operator layer

The site should feel like a **well-used workstation**, not a freshly opened one. Density and information packing are authentic to the aesthetic. The following patterns are explicitly permitted:

**Information density inside operator panels:**
- IBM 3270-style field codes: `[01] FIELD ......: value` format in InfoTable (fieldCodes mode)
- Vim/less-style line number gutter on the left of panel content (lineNumbers prop)
- Vim-style status bar at bottom of panel: `-- NORMAL -- title | rows:col | branch` (statusLine prop)
- Secondary metadata in panel header right slot: `title | ~/path | branch` (titleExt prop)

**List and content formatting:**
- Tree-branch unicode (`├──` `└──` `│`) as list structure in project and content lists
- Ranked index prefixes: `001 │ date │ [tag] │ title` for blog list items
- Column dividers `│` in timeline/experience layouts
- Status markers `●` (current) / `○` (past) in timeline rows
- `OK ·` / `INFO ·` / `WARN ·` prefixes in status output (no brackets, no color coding)

**Still forbidden:**
- Any chromatic accent color (purple, teal, amber, green — no accent family)
- Neon glow, phosphor glow, or text-shadow decoration on any element
- Scanlines, CRT noise grain, vignette, or any atmospheric texture overlay
- Green-on-black or any non-neutral color scheme
- CRT screen curvature, bezels, or screen-frame graphics
- Retro power-on / boot-up intro animations
- ASCII art illustrations (box-drawn frames and labels are fine; character art is not)
- Matrix code-rain effects
- Drop shadows on flat panels

---

# Layout guidelines

- Use a layout that feels designed, not templated.
- Prefer slightly asymmetric or editorial compositions over overly centered and overly balanced template layouts.
- Use whitespace deliberately.
- Create strong section rhythm.
- Use content width intelligently:
  - tighter width for text-heavy sections
  - wider width for project showcases and visual sections
- Avoid “3 equal cards in a row” as the default solution.
- Avoid making every section visually identical.
- Prefer layout variation across sections while keeping the same design language.

## Good layout patterns

- split hero: text + visual / artifact
- alternating project rows
- editorial stacked sections
- image-text asymmetric modules
- timeline-style resume blocks
- structured blog lists with strong metadata

## Decorative blocks as layout rhythm

- Decorative terminal blocks (MobileTerminal components) function as section dividers and breathing space between content sections.
- Alternate content and decorative sections for rhythm -- never stack two decorative blocks back-to-back.
- Hide excess decoration on mobile (`hidden sm:block`) to keep content scannable on small screens.
- Each decorative block should relate to a real mobile dev tool (adb, gradle, xcode, fastlane, git, ktlint).

## Avoid

- overusing identical cards
- too much center alignment
- excessive symmetry
- template-looking feature grids
- more than 6-8 decorative sections on a single page
- stacking decorative blocks without content sections between them

---

# Typography guidelines

Typography should carry the design.

- **Geist Sans** (`--font-sans`) is the primary font for site chrome: headings (including inside blog prose), UI copy, navigation, labels, and button text. It replaces the former monospace-everywhere approach.
- **Piazzolla** (`--font-serif`) is reserved for blog post body prose only — a variable-weight high-contrast serif with native Cyrillic. It gives long-form reading surfaces editorial warmth while site chrome stays geometric.
- **Geist Mono** (`--font-mono`) is demoted to code blocks, terminal output components (`Cmd`, `BootBlock`, `InfoTable`), and `.label-meta` metadata strips.
- **Geist Pixel** (`--font-pixel`) is reserved for decorative numbered section prefixes only — maximum 6 uses per page.
- Create a clear type hierarchy using **weight** (400→500), **opacity**, and **size** -- not font switching between families.
- Headings should feel deliberate and confident; use `display-1` / `display-2` at display sizes with negative tracking.
- Body prose (blog posts) uses Piazzolla (`--font-serif`) at 17px, line-height 1.7, `letter-spacing: 0`, max-width 46rem (~70ch). Headings *inside* the prose stay in Geist Sans so they match the TOC and the rest of the site.
- Avoid too many font sizes and weights.
- Use consistent line-height and spacing rhythm.

## Custom font size scale

| Class | Size | Use |
|-------|------|-----|
| `display-1` | clamp(40–64px), wt 500, tracking -0.028em | Hero name only |
| `display-2` | clamp(28–40px), wt 500, tracking -0.020em | Post titles, major section heads |
| `h1` | clamp(28–36px) | Page headings |
| `h2` | 20px | Section headings (inside SectionHeader) |
| `h3` | 17px | Sub-section headings |
| body | 15–17px | UI copy, navigation |
| `label-meta` | 11px Geist Mono, uppercase, tracking 0.12em | Metadata strips, section number labels |

## Typography tone

- precise
- technical
- confident
- readable — Geist Sans provides warmth to UI chrome that pure monospace did not; Piazzolla extends that warmth into long-form blog reading
- not decorative for decoration’s sake

---

# Color guidelines

Use a strictly neutral color system. There is no chromatic accent color.

## Preferred palette structure

- **Dark mode (primary):** near-black graphite canvas (`#0b0b0c`) with eggshell text (`#e9e8e4`)
- **Light mode:** warm paper canvas (`#f5f3ee`) with ink text (`#101012`)
- Secondary text via opacity and `--muted-foreground` / `--muted-foreground-dim` tokens
- Emphasis via `--emphasis`: pure white on dark, pure black on light

## Opacity hierarchy

The design uses opacity layering for information depth:

- **Primary text:** `/80` to `/100` -- names, roles, headings, active nav links
- **Secondary text:** `/60` to `/70` -- body prose, focus areas, inactive nav links
- **Tertiary text:** `/45` to `/55` -- supporting details, third-priority paragraphs
- **Decorative text:** `/20` to `/35` -- panel header labels, ambient indicators

### WCAG contrast requirements

**Hard rule:** Any text that conveys information (labels, nav links, metadata, section headers, button text) must meet WCAG AA contrast ratios:

- Normal text (< 18px / < 14px bold): 4.5:1 minimum
- Large text (>= 18px / >= 14px bold): 3:1 minimum

Both `--muted-foreground` tokens are verified to meet AA on their respective backgrounds. Decorative-only text may fall below these thresholds but should remain perceptible.

## Emphasis and the only non-neutral token

There is no accent color family. The only "accent" is `--emphasis` (pure white / pure black). Acceptable uses:
- active navigation state (weight 500 + 1px underline)
- inline link underline on hover
- key identity display moment
- focus ring: `outline: 2px solid var(--emphasis); outline-offset: 3px`

`--destructive` (`#e8634b` dark / `#b83a28` light) is the only non-neutral token. Reserve it strictly for destructive UI actions (delete, irreversible operations). Never use it as decoration.

## Avoid

- any chromatic accent color (purple, teal, amber, blue, orange — all forbidden as accent)
- multiple signal colors (no green/amber/red status coding — use muted-foreground for all status text)
- loud gradients
- neon tones or glow effects
- oversaturated palettes
- visually trendy colors with no relationship to the brand

Contrast must remain excellent and the design must stay readable.

---

# Component guidelines

Use a compact, reusable component system.

## Buttons

Buttons should be clear, minimal, and functional.

### Variants

- Primary button
  - used for main CTA
  - visually strongest action in a section
- Secondary button
  - used for supporting actions
  - lower emphasis
- Tertiary / text button
  - used for subtle navigation or inline actions

### Rules

- Keep button labels concise
- Avoid oversized pill buttons
- Avoid overly glossy or “startup premium” button styling
- Hover and focus states should be subtle and polished

## Links

Links are important in this project because the site must connect to external platforms.

Support links for:

- GitHub
- Google Play
- App Store
- Blog posts
- contact channels

Links should feel intentional and elegant, not like default browser links.

## Tags / labels

Use small mono metadata labels sparingly for:

- Android
- iOS
- KMP
- MobileOps
- CI/CD
- Design Systems
- Blog categories
- Dates

Do not overdecorate sections with tags.

## Cards

Cards may be used, but do not rely on them for every layout.

- Avoid soft oversized SaaS cards
- Prefer sharper, calmer modules
- Use cards only when they improve grouping and readability
- Do not make the whole website a grid of identical rectangles

## Terminal components

The project uses a flat operator-panel kit as its primary design system. All components use `1px solid var(--border)`, `border-radius: 2px`, no shadow, no traffic lights, no window chrome gradients.

- **MacWindow** -- flat operator panel with a `.label-meta` header row (`sectionNumber / LABEL` left, `titleExt` right); opt-in `lineNumbers` and `statusLine` props; replaces former macOS window mockup
- **SectionHeader** -- new shared component; numbered label row + `<h2>` heading + `border-bottom: 1px solid var(--rule)`; applied to every home section and primary page header
- **BootBlock** -- status output lines prefixed with `OK ·` / `INFO ·` / `WARN ·` in `--muted-foreground`; no color coding; keep to 4–6 lines
- **Cmd** -- `$ command` prompt line in `--font-mono`; prompt `$` at `--emphasis /70`; introduces content sections
- **OutputBlock** -- indented output wrapper with fade-in stagger; `2px solid var(--rule)` left border
- **PanelShell** -- compact bordered block for sidebar widgets; same flat border treatment as MacWindow
- **InfoTable** -- two-column key-value table; `fieldCodes` mode renders IBM 3270 `[01] KEY ......: value`; key column `--font-mono` 11px, value column `--font-sans` 14px

These components are the project's equivalent of cards and panels. Keep them consistent in spacing, border treatment (`var(--border)`), and background (`var(--card)`).

---

# Section guidelines

## Hero / Intro

This section should immediately explain who the site belongs to, using the terminal boot/whois pattern.

### Hero structure

1. **Boot block** -- system initialization messages (SDK detection, toolchain status, last login timestamp). Keep to 4-6 lines maximum.
2. **`$ whois` command** -- introduces identity via an InfoTable inside a MacWindow.
3. **Decorative sidebar** (desktop only) -- atmospheric system widgets (CPU monitor, network graph). Must remain secondary to the identity content.

### Must include

- name: **Nikita Pochaev** -- must have visual prominence, not just buried in a data table row
- handle: **@po4yka**
- role statement: Mobile Developer -- Android, iOS, Kotlin Multiplatform, MobileOps
- status or availability line
- **A visible heading** (name + role) must exist beyond sr-only -- can be styled within terminal chrome but must have clear visual weight
- **Above-fold CTAs or navigation** -- either inline action links (terminal-styled is fine) or a clear path to the Links section

### Hero rules

- Keep it precise
- Avoid generic marketing copy
- Decorative system widgets may appear in hero sidebar on desktop; keep them secondary to identity content
- Use one strong compositional idea
- The hero should feel instantly credible
- Boot block versions should be periodically updated or pulled from config

## About / Profile

This section should be compact and readable.

Focus on:

- who Nikita is as an engineer
- mobile engineering focus
- Android / iOS / KMP / MobileOps
- engineering taste
- release, build, tooling, and product craft mindset

Avoid long autobiography text.

## Selected Apps / Projects

This is one of the most important sections.

Each project/app entry should be able to show:

- project name
- short summary
- role or focus
- platform metadata
- links to:
  - GitHub
  - Google Play
  - App Store
- optional visual support:
  - app screenshot
  - device frame
  - abstract project visual

### Project section rules

- do not use generic equal cards by default
- prefer rows, split modules, alternating layouts, or editorial blocks
- each project should feel distinct but still belong to one system
- show enough metadata to feel real
- avoid bloated descriptions

## Resume / Experience

This should work as a compact professional summary.

Possible content:

- selected experience
- roles
- dates
- company / project
- short 1–2 line summaries
- focus areas

### Rules

- do not make it a boring CV dump
- do not recreate LinkedIn visually
- use elegant structure and good scanning behavior
- keep it concise and useful

## Blog

The blog is a real first-class section, not an afterthought.

It should support:

- featured post
- article list
- categories / tags
- dates
- short summaries

The blog should feel:

- calm
- typographic
- thoughtful
- technical
- readable

It should be suitable for:

- engineering notes
- mobile dev posts
- architecture thoughts
- tooling and MobileOps writing
- release / build workflow posts

## Footer / Contact

The footer should be minimal and useful.

Include support for:

- GitHub
- Google Play
- App Store
- email / Telegram / LinkedIn placeholders
- copyright / signature line

Do not overdesign the footer.

---

# Motion and interaction guidelines

Animations are important in this project, but they must feel refined.

## Motion goals

Motion should add:

- tactility
- rhythm
- personality
- polish
- hierarchy

## Good motion ideas

- subtle reveal on first load
- staggered text entrances
- underline or line-draw hover interactions
- smooth project hover transitions
- soft parallax only when restrained (>= 8px range to be perceptible)
- animated dividers or separators
- elegant section transitions
- subtle scroll-linked movement
- refined blog list hover behavior
- gentle motion on hero artifact or visual support

## Terminal-specific motion

- Staggered line reveals for terminal output (0.03-0.05s between lines)
- Interval-based widget updates: CPU/memory panels update on 3-10s cycles, not every frame
- Scroll-velocity-linked activity simulation is permitted but should be subtle
- Terminal cursor blink animation for interactive elements

## Motion rules

- motion must support clarity
- motion must never block reading
- motion must not reduce credibility
- keep transitions smooth and calm
- maintain accessibility and restraint
- ensure the experience still feels premium with motion reduced or disabled

## Avoid

- scroll-jacking
- dramatic cinematic intros
- floating blobs
- noisy particles
- fake 3D gimmicks
- constant movement everywhere
- motion that exists only to impress

---

# Blog and content guidelines

- Write content that feels specific and real.
- Prefer concise and concrete wording.
- Avoid generic self-promotional phrasing.
- Titles should feel like real blog posts, not SEO bait.
- Summaries should be short and intelligent.
- Metadata should be clear and consistent.
- Writing should support the perception of real expertise.

## Avoid phrases like

- passionate developer
- crafting digital experiences
- innovative solutions
- impactful products
- building the future
- full-stack of creativity and technology

Use more concrete alternatives tied to real work.

---

# Imagery and visual assets

- Prefer minimal, real, or structured imagery.
- App screenshots and device visuals are welcome where relevant.
- Use abstract visual accents only if they are restrained and clearly purposeful.
- Avoid random AI-looking illustrations.
- Avoid generic 3D blobs and floating abstract renders unless they are extremely subtle and clearly integrated into the design system.
- Visual support should never overpower the typography and structure.

---

# Responsiveness guidelines

This project must be responsive from the beginning.

- Design desktop and mobile intentionally
- Do not simply collapse desktop into mobile
- Preserve hierarchy and rhythm across breakpoints
- Reconsider spacing, type scale, and layout composition for smaller screens
- Mobile should feel as carefully designed as desktop
- External links and CTAs must remain easy to access on mobile
- Project blocks and blog lists must remain readable and scannable on small screens

---

# Quality bar

Before considering any design solution complete, check that it meets all of these conditions:

- It feels like a real developer’s website
- It does not feel like a generic AI portfolio
- It does not look like a startup landing page
- It does not feel like a generic hacker/Matrix theme
- It communicates real expertise clearly
- The typography feels intentional
- The composition feels designed
- The content feels specific
- Motion feels tasteful
- The layout remains readable and calm
- The result is minimal but not empty
- The result is distinctive but not noisy
- **Text contrast meets WCAG AA on all functional content**
- The terminal metaphor serves the content, not the other way around

If a design looks trendy but weak in identity, simplify it.

If a layout looks polished but generic, make it more authored.

If a section feels decorative but not useful, remove or rethink it.

If a terminal block exists only for visual filler, cut it.

---

# Final rule

This website should feel like:

- a personal resume site
- a developer portfolio
- a technical blog
- a digital business card

all at once, within one refined and coherent visual system.

The result should be **minimal, credible, authored, technical, elegant, and memorable**.
