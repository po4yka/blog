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

Use a **terminal-native developer workstation aesthetic**.

The visual language is built on the metaphor of a developer's actual terminal session -- the site should feel like opening a well-configured Ghostty or Kitty terminal, not like browsing a startup landing page.

The visual language should combine:

- terminal authenticity (real CLI patterns, not decorative approximations)
- monospace-first typography with opacity-driven hierarchy
- Catppuccin Mocha palette as the primary dark theme
- calm whitespace between terminal blocks
- refined micro-interactions within terminal chrome
- atmospheric system widgets that reinforce the workstation feel

The terminal metaphor must stay grounded and credible:

- Do not turn the website into a retro gimmick, sci-fi concept, or generic hacker/Matrix theme.
- Terminal output should resemble real developer tools (adb, gradle, xcode, fastlane, git) -- not fictional commands.
- The aesthetic should feel like a real mobile engineer's environment.

## Terminal density and atmospheric layer

The site should feel like a **well-used terminal**, not a freshly opened one. Density, wear, and information packing are authentic to the aesthetic. The following patterns are explicitly permitted:

**Atmospheric texture (subtle, non-distracting):**
- Scanlines via CSS pseudo-element at ≤ 4% opacity (2px repeating gradient)
- Phosphor noise grain at ≤ 2% opacity (SVG noise data-URI)
- Radial vignette darkening corners by ≤ 8% (CRT depth suggestion, no actual curvature)
- Phosphor text-shadow glow on accent text only: `0 0 8–10px rgba(accent, 0.25–0.35)` — creates ambient purple presence without neon intensity

**Information density inside MacWindow:**
- IBM 3270-style field codes: `[01] FIELD ......: value` format in InfoTable (fieldCodes mode)
- Vim/less-style line number gutter on the left of MacWindow content (lineNumbers prop)
- Vim-style status bar at bottom of MacWindow: `-- NORMAL -- title | rows:col | branch` (statusLine prop)
- Secondary metadata in MacWindow titlebar: `title | ~/path | branch` (titleExt prop)

**List and content formatting:**
- Tree-branch unicode (`├──` `└──` `│`) as list decoration in project and content lists
- Ranked index prefixes: `001 │ date │ [tag] │ title` for blog list items
- Column dividers `│` in timeline/experience layouts
- Status markers `●` (current) / `○` (past) in timeline rows
- `[ OK ]` / `[ INFO ]` / `[ WARN ]` prefixes beyond just BootBlock — any status output

**Still forbidden (these remain Matrix/gimmick territory):**
- Neon glow at alpha > 0.40 on any element
- Green-on-black color scheme (the accent stays purple, not CRT green)
- CRT screen curvature, bezels, or screen-frame graphics
- Retro power-on / boot-up intro animations
- ASCII art illustrations (box-drawn frames and labels are fine; robot/character ASCII is not)
- Matrix code-rain effects or green code waterfalls
- Scanlines thick enough to be visually distracting (> 4% opacity)
- Color palettes other than Catppuccin Mocha dark / lavender-editorial light

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

- **JetBrains Mono** is the primary font for all UI: headings, body text, labels, navigation, and terminal output.
- **Inter** (`--font-sans`) is available as an optional contrast font for long-form blog prose where extended reading comfort matters.
- Create a clear type hierarchy using **opacity, weight, and size** -- not font switching.
- Headings should feel deliberate and confident within the monospace system.
- Body text must remain highly readable despite being monospace -- use generous line-height (1.6-1.8) and comfortable font sizes.
- Avoid too many font sizes and weights.
- Use consistent line-height and spacing rhythm.

## Custom font size scale

The project uses a compact font size scale designed for monospace:

- `text-2xs` (8px), `text-3xs` (9px) -- decorative labels only
- `text-xs` (10px), `text-label` (11px) -- metadata, small tags
- `text-mono-sm` (12px), `text-mono` (13px) -- standard body and UI
- `text-mono-lg` (15px) -- emphasized text
- Standard Tailwind sizes for headings (h1: 1.5rem, h2: 1.125rem)

## Typography tone

- terminal
- precise
- technical
- intelligent
- warm despite being monospace
- not cold
- not decorative for decoration’s sake

---

# Color guidelines

Use a restrained color system.

## Preferred palette structure

- **Dark mode (primary):** Catppuccin Mocha-inspired palette with deep background, layered surface colors
- **Light mode:** softly tinted background with charcoal/graphite text
- muted secondary text via opacity layering
- one controlled accent color only (purple/indigo family)

## Opacity hierarchy

The design uses opacity layering for information depth:

- **Primary text:** `/80` to `/100` -- names, roles, headings, active nav links
- **Secondary text:** `/60` to `/70` -- body prose, focus areas, inactive nav links
- **Tertiary text:** `/45` to `/55` -- supporting details, third-priority paragraphs
- **Decorative text:** `/20` to `/35` -- window titles, ambient labels, hints

### WCAG contrast requirements

**Hard rule:** Any text that conveys information (labels, nav links, metadata, section headers, button text) must meet WCAG AA contrast ratios:

- Normal text (< 18px / < 14px bold): 4.5:1 minimum
- Large text (>= 18px / >= 14px bold): 3:1 minimum

Decorative-only text (window chrome titles, ambient status indicators) may fall below these thresholds but should remain perceptible.

## Accent color rules

Use only one accent family across the entire project.

Acceptable accent directions:

- muted blue
- teal
- warm amber
- restrained orange

The accent should be used sparingly for:

- links
- active states
- key highlights
- small emphasis moments

## Avoid

- multiple accent colors competing at once
- loud gradients
- neon tones
- oversaturated palettes
- pure black unless absolutely necessary
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

The project uses a terminal component kit as its primary design system:

- **MacWindow** -- titled window chrome with traffic light dots; used to frame content sections
- **BootBlock** -- system initialization status lines ([ OK ] / [ INFO ] prefixes)
- **Cmd** -- `$ command` prompt display, introduces content sections
- **OutputBlock** -- indented output wrapper with fade-in animation
- **PanelShell** -- compact bordered panel for system widgets (CPU, memory, network)
- **InfoTable** -- key-value table for structured data display (whois, project metadata)

These components are the project's equivalent of cards and panels. Keep them consistent in spacing, border treatment, and background colors.

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
