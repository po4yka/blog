---
name: signal-deck
description: "Terminal-industrial design system merging Nothing-style restraint with operator-console logic. Trigger on: 'signal deck', 'signal-deck', '/signal-deck', 'operator console style', 'terminal modernism', 'phosphor design'. NEVER auto-trigger for generic UI tasks."
version: 1.0.0
---

# Signal Deck -- Terminal Industrial Design System

A design system that merges industrial minimalism with operator-console logic. The result should feel like a modern hardware control surface: precise, signal-driven, monochrome-dominant, with phosphor accents that indicate state rather than decorate space.

---

## 1. DESIGN PHILOSOPHY

- **Signal over decoration** -- Every element transmits information or affords interaction. If it does neither, remove it.
- **Monochrome is the substrate** -- The grayscale carries hierarchy. Color is a state change, not a default.
- **Terminal logic shapes architecture** -- Information density, prompt-response flow, and status-line semantics inform layout, not surface aesthetics.
- **Type is the instrument** -- Scale, weight, spacing, and font-family switching create hierarchy. Not color. Not icons. Not borders.
- **Character-cell rhythm** -- Alignment, spacing, and modularity follow the logic of a monospaced grid even when the typeface is proportional.
- **Restraint is the signal** -- The one phosphor accent, the one oversized metric, the one blinking cursor -- restraint makes each signal moment powerful.
- **Both modes are first-class** -- Dark mode (deep charcoal, instrument panel) and light mode (technical manual, off-white paper) are designed independently. Ask which to start with.

---

## 2. CRAFT RULES -- HOW TO COMPOSE

### 2.1 Visual Hierarchy: The Three-Layer Rule

Every screen has exactly THREE layers of importance:

| Layer | What | How |
|-------|------|-----|
| **Primary** | THE ONE thing seen first -- a metric, a heading, a status | Display mono at hero size (`--text-display`). 48-96px breathing room around it. |
| **Secondary** | Supporting context -- labels, descriptions, related data | Editorial sans at body/subheading (`--text-primary`). Grouped tight (8-16px) to primary. |
| **Tertiary** | Metadata, navigation, system chrome. Visible but never competing. | Mono at caption/label (`--text-secondary` or `--text-muted`). ALL CAPS, letterspaced. Pushed to edges. |

**Squint test:** Blur your eyes. Can you still identify the primary element? If everything looks the same weight, the hierarchy has failed.

**Common mistake:** Making everything "secondary" -- evenly-sized, evenly-spaced content that reads as a flat wall. Be decisive: make primary absurdly large, tertiary absurdly small.

### 2.2 Font Discipline

Per screen, use MAXIMUM:
- 2 font families (editorial sans + engineering mono)
- 3 font sizes (one large, one medium, one small)
- 2 font weights (Regular + one other -- usually Light or Medium)

**Budget principle:** Every additional size or weight costs visual coherence. Before adding a new size, ask: can spacing or opacity solve this instead?

| Decision | Size | Weight | Opacity |
|----------|:----:|:------:|:-------:|
| Heading vs body | Yes | No | No |
| Label vs value | No | No | Yes |
| Active vs inactive nav | No | No | Yes |
| Hero metric vs unit | Yes | No | No |
| Section title vs content | Yes | Optional | No |
| Prompt prefix vs command text | No | No | Yes |

**Rule:** If reaching for a new font-size, it is probably a spacing problem.

### 2.3 Spacing as Meaning

Spacing is the primary grouping tool. Dividers are a fallback, not a default.

```
Tight (4-8px)    = "These belong together" (icon+label, number+unit, prefix+command)
Medium (16px)    = "Same group, different items" (list items, form fields, status rows)
Wide (32-48px)   = "New group starts here" (section breaks, panel boundaries)
Vast (64-96px)   = "New context entirely" (hero to content, major divisions)
```

**Critical rule:** If you need a divider line, the spacing is probably wrong. Dividers are a symptom of insufficient spacing contrast. Use them only in data-dense lists where items are structurally identical (log rows, stat tables).

### 2.4 Container Strategy (Preference Order)

1. **Spacing alone** (proximity groups items)
2. A `1px` divider line (hairline, `--border`)
3. A visible border outline (`--border-visible`)
4. A surface card with background shift (`--surface`)

Each step adds visual weight. Use the lightest tool that works. Never box the most important element -- let it breathe on the background.

**Terminal exception:** Command-input areas and status-lines are containers by nature (they frame a functional zone). These earn their borders.

### 2.5 Color as Hierarchy

In a monochrome system, the grayscale IS the hierarchy. Maximum 4 opacity levels per screen:

```
--text-display (100%)    Hero metrics, active commands. One per screen.
--text-primary (85%)     Body text, primary content, values.
--text-secondary (55%)   Labels, captions, metadata, timestamps.
--text-muted (35%)       Disabled states, ambient chrome, decorative elements.
```

**Signal accent is NOT part of the grayscale hierarchy.** It is an interrupt -- "this element has active state" or "this value is anomalous." If nothing is active or anomalous, no accent on the screen.

**Status colors** (success, warning, error) are exempt from the "one accent" rule when encoding data values. Apply color to **the value itself**, not to labels or row backgrounds. Labels stay `--text-secondary`.

### 2.6 Consistency vs Variance

**Be consistent in:** Font families, label treatment (always mono ALL CAPS), spacing rhythm, color roles, component shapes, alignment grid.

**Break the pattern in exactly ONE place per screen:** An oversized metric, a phosphor-accented status indicator, a blinking cursor, a dot-matrix display element, or a vast empty gap where everything else is tight.

This single break IS the design. Without it: sterile grid. With more than one: visual noise.

### 2.7 Compositional Balance

**Asymmetry over symmetry.** Centered layouts feel generic. Favor deliberately unbalanced composition:

- **Large left, small right** -- hero metric + metadata stack
- **Top-heavy** -- big status headline near top, sparse detail below
- **Edge-anchored** -- primary data pinned to screen edges, negative space in center
- **Status-line anchored** -- persistent status information at bottom edge, content above

Balance heavy elements with more empty space, not with more heavy elements.

### 2.8 The Signal Deck Character

1. **Confidence through emptiness** -- Large uninterrupted background areas. Resist filling space. An operator console has blank panel space between instrument clusters.
2. **Precision in the small things** -- Letter-spacing, exact gray values, 4px gaps, 1px borders. Micro-decisions compound into craft.
3. **Data as beauty** -- `2.4GHz // 8 CORES // 96C` in mono at 48px IS the visual. No illustrations needed.
4. **Operator honesty** -- Controls look like controls. A toggle is a switch. A gauge is an instrument. A prompt expects input.
5. **One signal moment** -- A phosphor-green metric. A blinking cursor. A pulsing status dot. Restraint makes the one expressive moment powerful.
6. **Discrete, not fluid** -- Imagine UI sounds: keyclick not swoosh, relay-tick not chime, dot-matrix print not fade. Transitions feel mechanical and precise.
7. **Terminal density where earned** -- Status-lines, log outputs, and telemetry panels can be information-dense. Editorial sections stay open and breathing. The contrast between dense instrument zones and calm reading zones IS the rhythm.

### 2.9 Visual Variety in Data-Dense Screens

When 3+ data sections appear on one screen, vary the visual form:

| Form | Best for | Weight |
|------|----------|--------|
| Hero metric (large mono) | Single key value | Heavy -- use once |
| Segmented telemetry bar | Progress / utilization | Medium |
| Sparkline / trace | Trend over time | Medium |
| Stat row (label + value) | Simple data points | Light |
| Status dot + text | Binary state (on/off, ok/error) | Lightest |
| Inline compact bar | Secondary metrics in rows | Light |
| Ring / arc gauge | Percentage / capacity | Medium |

Lead section gets the heaviest treatment. Secondary gets a different form. Tertiary gets the lightest. The FORM varies; the VOICE stays the same.

### 2.10 Terminal Information Architecture

When a screen has command/response or status-monitoring semantics, use these patterns:

**Prompt-line:** A fixed-position input zone with a visible prefix (`>`, `$`, or label). The prefix is `--text-muted`; typed content is `--text-primary`. The prompt is always at a screen edge (bottom or top).

**Status-line:** A persistent narrow bar showing system state -- mode, location, connection, timestamp. Always mono, ALL CAPS, `--text-secondary`. Positioned at the opposite edge from the prompt.

**Log/output zone:** The scrollable area between prompt and status-line. Newest content appears adjacent to the prompt. Timestamps left-aligned in `--text-muted`, content in `--text-primary`.

**Boot sequence:** Content that reveals line-by-line with staggered timing (30-50ms per line). Each line has a status prefix: `[OK]`, `[--]`, `[!!]`. Used for initialization, loading, or onboarding flows.

---

## 3. ANTI-PATTERNS -- WHAT TO NEVER DO

- No gradients in UI chrome (data visualization heat maps excepted)
- No drop shadows or blur. Flat surfaces, border separation only.
- No skeleton loading screens. Use `[LOADING...]` bracket text or a segmented spinner.
- No toast popups. Use inline status text: `[SAVED]`, `[ERR: reason]`, `[OK]`.
- No sad-face illustrations, cute mascots, or multi-paragraph empty states
- No zebra striping in tables. Use dividers.
- No filled icons, multi-color icons, or emoji as UI elements
- No parallax, scroll-jacking, or gratuitous animation
- No spring/bounce easing. Use `ease-out` or `steps()` only.
- No `border-radius > 12px` on cards/panels. Buttons: pill (999px) or technical (2-4px).
- No full-screen scanline overlays. Scanlines are signal-surface devices, not wallpaper.
- No neon glow with alpha > 0.25. Phosphor accents are precise, not diffuse.
- No green-on-black "hacker movie" color schemes. The base is near-black with off-white text.
- No constant cursor-blink on non-interactive elements. Blink indicates "awaiting input" only.
- No skeuomorphic CRT bezels, screen curvature, or power-on boot animations
- Data visualization: differentiate with **opacity** (100%/60%/30%) or **pattern** (solid/dashed/dotted) before introducing color.

---

## 4. WORKFLOW

1. **Declare fonts** -- Load the font stack from `references/tokens.md`. Confirm with user.
2. **Choose mode** -- Dark or light? Neither is default. Dark = instrument panel. Light = technical manual.
3. **Choose signal accent** -- Phosphor green, amber, or cool blue. One per project. See `references/tokens.md` for values.
4. **Sketch hierarchy** -- Identify the 3 layers (primary/secondary/tertiary) before writing any code.
5. **Compose** -- Apply craft rules (Sections 2.1-2.10). Identify the ONE pattern-break per screen.
6. **Check tokens** -- Consult `references/tokens.md` for exact values.
7. **Build components** -- Consult `references/components.md` for patterns and anatomy.
8. **Adapt to platform** -- Consult `references/platform-mapping.md` for output conventions.

---

## 5. REFERENCE FILES

| File | Contains |
|------|----------|
| `references/tokens.md` | Typography, color, spacing, motion, iconography, signal-surface, and terminal-specific tokens |
| `references/components.md` | 18 component types with anatomy, states, and token mappings |
| `references/platform-mapping.md` | Output conventions for HTML/CSS, React/Tailwind, SwiftUI, Jetpack Compose |
