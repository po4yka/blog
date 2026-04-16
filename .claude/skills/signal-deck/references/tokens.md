# Signal Deck -- Design Tokens

Exact values for every design decision. When in doubt, use these values literally.

---

## 1. TYPOGRAPHY

### Font Stack

| Role | Font | Fallback | Weight | When |
|------|------|----------|--------|------|
| **Display** | `"IBM Plex Mono"` | `"JetBrains Mono", "SF Mono", monospace` | 300 Light, 400 Regular | Hero metrics, display numbers, dot-matrix moments. 36px+ only. |
| **Body / UI** | `"Inter"` | `"DM Sans", system-ui, sans-serif` | 300 Light, 400 Regular, 500 Medium | Headings, body text, descriptions, navigation labels. |
| **Data / Labels** | `"JetBrains Mono"` | `"IBM Plex Mono", "SF Mono", monospace` | 400 Regular, 500 Medium | ALL CAPS labels, timestamps, counters, IDs, prompts, status prefixes, data rows, technical values. |

**Why these fonts:**
- IBM Plex Mono has industrial authority at display sizes -- designed for instrument panels and technical interfaces. Its Light weight at large sizes creates the "control surface readout" effect.
- Inter is the definitive editorial sans -- optically precise, wide language support, variable font. It carries body hierarchy without competing with mono elements.
- JetBrains Mono is engineered for code readability -- ligatures optional, consistent character width, clear at small sizes.

**Google Fonts load:**
```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Type Scale

| Token | Size | Line Height | Letter Spacing | Use |
|-------|------|-------------|----------------|-----|
| `--display-xl` | 72px | 1.0 | -0.03em | Hero metrics, time displays, single key numbers |
| `--display-lg` | 48px | 1.05 | -0.02em | Section hero values, percentages, primary readouts |
| `--display-md` | 36px | 1.1 | -0.02em | Page titles, display-size labels |
| `--heading` | 24px | 1.2 | -0.01em | Section headings |
| `--subheading` | 18px | 1.3 | 0 | Subsection titles |
| `--body` | 16px | 1.5 | 0 | Body text, descriptions |
| `--body-sm` | 14px | 1.5 | 0.01em | Secondary body, compact content |
| `--caption` | 12px | 1.4 | 0.04em | Timestamps, footnotes, tertiary info |
| `--label` | 11px | 1.2 | 0.08em | ALL CAPS mono labels, status prefixes, panel headers |
| `--micro` | 9px | 1.2 | 0.1em | Ambient indicators, decorative chrome (non-functional) |

### Typographic Rules

- **Display (IBM Plex Mono):** 36px+ only, Light 300 preferred. Tight tracking (-0.02 to -0.03em). Never for body text. Used for hero metrics, dot-matrix moments, and single key readouts.
- **Labels:** Always JetBrains Mono, ALL CAPS, 0.06-0.1em letter-spacing, 11-12px. These read as "instrument panel labels" -- the visual signature of the system.
- **Data / Numbers:** Always JetBrains Mono. Units as `--label` size, adjacent to value. Tabular figures for alignment in columns.
- **Body:** Always Inter. Regular 400 for body, Medium 500 for emphasis. Never bold (700) in body text.
- **Prompt prefixes:** JetBrains Mono, `--text-muted` color. `>`, `$`, `::`, or `[LABEL]` format.
- **Status prefixes:** JetBrains Mono, `--label` size. Format: `[OK]`, `[--]`, `[!!]`, `[..]`. Color matches status.
- **Hierarchy ceiling:** display mono > heading sans > label mono caps > body sans. Four levels maximum.

---

## 2. COLOR SYSTEM

### Signal Accent (Choose One Per Project)

| Accent | Token | Hex | Character |
|--------|-------|-----|-----------|
| **Phosphor Green** | `--signal` | `#39FF85` | Mainframe terminal, system-nominal, always-on diagnostic |
| **Amber** | `--signal` | `#FFB833` | Warm instrument, analog gauge, industrial caution-positive |
| **Cool Blue** | `--signal` | `#5BA8FF` | Modern telemetry, digital readout, clinical precision |

Pick one. Use it for: active states, anomalous values, the ONE accent moment per screen, interactive focus rings, and cursor/caret color. Never use it decoratively or as background fill.

`--signal-subtle`: The chosen accent at 12% opacity. For hover backgrounds and focus rings only.

### Dark Mode (Default -- Instrument Panel)

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#0A0A0C` | Primary background. Near-black with cool undertone. Not pure #000. |
| `--surface` | `#131316` | Elevated surfaces, cards, panels |
| `--surface-raised` | `#1C1C20` | Secondary elevation, nested panels, input backgrounds |
| `--border` | `#1F1F24` | Subtle dividers, decorative hairlines. Nearly invisible. |
| `--border-visible` | `#2E2E35` | Intentional borders, panel outlines, wireframe lines |
| `--text-muted` | `#4A4A55` | Disabled text, ambient chrome, decorative labels |
| `--text-secondary` | `#8A8A96` | Labels, captions, metadata, timestamps |
| `--text-primary` | `#D8D8DE` | Body text, values, descriptions |
| `--text-display` | `#F0F0F4` | Headlines, hero metrics, active commands |

### Light Mode (Technical Manual)

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#F4F4F6` | Off-white page with cool undertone |
| `--surface` | `#FFFFFF` | Elevated surfaces (white on off-white = subtle lift) |
| `--surface-raised` | `#EDEDF0` | Nested panels, input backgrounds |
| `--border` | `#E0E0E4` | Subtle dividers |
| `--border-visible` | `#C8C8CE` | Intentional borders, panel outlines |
| `--text-muted` | `#A0A0AA` | Disabled text, ambient chrome |
| `--text-secondary` | `#6A6A76` | Labels, captions, metadata |
| `--text-primary` | `#1A1A1E` | Body text, values |
| `--text-display` | `#08080A` | Headlines, hero metrics |

### Status Colors (Identical in Both Modes)

| Token | Hex | When |
|-------|-----|------|
| `--status-ok` | `#3DB86A` | Confirmed, healthy, connected, within range |
| `--status-warn` | `#D4A32C` | Caution, pending, degraded, approaching limit |
| `--status-error` | `#D83B4D` | Failed, critical, over limit, destructive action |
| `--status-info` | `#8A8A96` | Informational (uses `--text-secondary` -- not a separate color) |

**Application rule:** Status color goes on the **value or indicator**, not on labels or row backgrounds. Labels stay `--text-secondary`. Trend arrows inherit value color. Background tints use status color at 8-12% opacity only in alert/banner contexts.

### Signal Accent as Phosphor

When using the signal accent for display elements or indicators, apply a controlled phosphor glow:

```css
.signal-glow {
  color: var(--signal);
  text-shadow: 0 0 8px color-mix(in srgb, var(--signal) 30%, transparent);
}
```

**Rules for phosphor glow:**
- Maximum alpha: 0.25. Never higher.
- Apply only to: the ONE signal moment per screen, active cursor/caret, pulsing status dots.
- Never apply to: body text, labels, backgrounds, decorative elements.
- In light mode: reduce glow alpha to 0.15 or omit entirely.

---

## 3. SPACING (8px Base)

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 2px | Optical adjustments, border offsets |
| `--space-2` | 4px | Icon-to-label gaps, tight component padding, prefix-to-content |
| `--space-3` | 8px | Component internal spacing, compact list items |
| `--space-4` | 16px | Standard padding, element gaps, list item spacing |
| `--space-5` | 24px | Group separation, card padding |
| `--space-6` | 32px | Section margins |
| `--space-7` | 48px | Major section breaks |
| `--space-8` | 64px | Page-level vertical rhythm |
| `--space-9` | 96px | Hero breathing room, vast separations |

### Character-Cell Grid

For terminal-density zones (status panels, log output, telemetry), align to a character-cell grid:

- **Cell width:** 8px (matches `--space-3` and standard mono character width at 13-14px)
- **Cell height:** 20px (mono line-height at `--body-sm`)
- **Columns:** Content width / 8px = available columns. Common: 80col (640px), 120col (960px).

This grid is a **design tool**, not a rendering constraint. Proportional-font sections ignore it. But mono-heavy panels (status bars, log output, data tables) should snap to this rhythm.

---

## 4. RADIUS, BORDERS, DIVIDERS

| Element | Radius | Border |
|---------|--------|--------|
| Cards / panels | 8-12px | `1px solid --border` or `--border-visible` |
| Compact panels | 4-6px | `1px solid --border-visible` |
| Technical elements (inputs, code blocks) | 2-4px | `1px solid --border-visible` |
| Buttons (primary/secondary) | 999px (pill) | Per variant |
| Buttons (technical/action) | 2-4px | Per variant |
| Tags / chips | 999px (pill) or 2px | `1px solid --border-visible` |
| Overlays / modals | 12px | `1px solid --border-visible` |

**Dividers:**
- Default: `1px solid var(--border)` -- barely visible, spatial hint only
- Intentional: `1px solid var(--border-visible)` -- clear separation
- Signal: `2px solid var(--signal)` -- active indicator, left-border accent
- Never: thick dividers (>2px), gradient dividers, decorative dividers

---

## 5. ICONOGRAPHY

- **Style:** Monoline, 1.5px stroke, no fill. 24x24 base grid, 20x20 live area.
- **Caps/joins:** Round caps, round joins.
- **Color:** Inherits text color of context. Never multi-color. Never filled.
- **Complexity:** Maximum 5-6 strokes per icon. Simpler is better.
- **Preferred sets:** Lucide (thin variant), Phosphor (thin variant). Either works; pick one per project.
- **Terminal-specific:** Use text characters as icons where appropriate: `>` (prompt), `|` (pipe), `::` (separator), `[ ]` (status brackets), `<` / `>` (navigation).

---

## 6. MOTION & INTERACTION

### Duration

| Type | Duration | When |
|------|----------|------|
| Micro (hover, focus) | 100-150ms | State changes on existing elements |
| Standard (expand, reveal) | 200-300ms | Panel transitions, content reveals |
| Sequence (boot, stagger) | 30-50ms per item | Line-by-line reveals, list staggers |

### Easing

| Token | Value | When |
|-------|-------|------|
| `--ease-out` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Default for all transitions |
| `--ease-step` | `steps(4, end)` | Segmented indicators, dot-matrix reveals, discrete state changes |
| `--ease-instant` | `steps(1, end)` | Binary state flips (on/off, visible/hidden) |

**Rules:**
- Prefer opacity transitions over position. Elements fade in; they do not slide.
- Hover: border or text brightens one level. No scale, no shadows, no lift.
- No spring physics, no bounce, no elastic. Everything is discrete and mechanical.
- Cursor blink: `1s steps(1)` infinite, opacity 0/1. Only on active input elements.
- Boot sequences: stagger reveal at 30-50ms per line, each line fading from 0 to full opacity.
- Segmented progress: fill segments left-to-right with `--ease-step`, not smooth.

### Interaction States

| State | Treatment |
|-------|-----------|
| Default | Base token values |
| Hover | Border/text brightens one level in the grayscale hierarchy |
| Focus | `2px solid var(--signal)` ring, `var(--signal-subtle)` background |
| Active/Pressed | `--surface-raised` background, `--text-display` text |
| Disabled | Opacity 0.35 or `--text-muted` color. Borders fade to `--border`. |
| Loading | `[LOADING...]` bracket text or segmented spinner. Never skeleton. |
| Error | Border shifts to `--status-error`. Inline `[ERR: reason]` text. |
| Success | Inline `[OK]` text in `--status-ok`. Auto-dismiss after 3s. |

---

## 7. SIGNAL SURFACES

Signal surfaces are controlled-use decorative/functional patterns that reinforce the terminal-industrial character. Use them as **devices**, not wallpaper.

### Dot-Matrix Grid

For decorative backgrounds, empty states, or loading zones:

```css
.dot-grid {
  background-image: radial-gradient(circle, var(--border-visible) 1px, transparent 1px);
  background-size: 16px 16px;
}
.dot-grid-subtle {
  background-image: radial-gradient(circle, var(--border) 0.5px, transparent 0.5px);
  background-size: 12px 12px;
}
```

- Dot size: 0.5-1.5px. Grid: 12-16px uniform spacing.
- Opacity: 0.1-0.2 for backgrounds, full for data-encoding grids.
- Never as container borders, button fills, or active content backgrounds.

### Scanline Accent

For signal-surface zones (status panels, telemetry headers):

```css
.scanline-accent {
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    color-mix(in srgb, var(--signal) 4%, transparent) 2px,
    color-mix(in srgb, var(--signal) 4%, transparent) 4px
  );
}
```

- Maximum opacity: 4%. Must be invisible during normal reading.
- Apply only to: panel headers, status-line backgrounds, telemetry zone overlays.
- Never full-screen, never on body content, never on cards.

### Status Brackets

Inline status indicators using bracket notation:

```
[OK]     -- --status-ok color
[..]     -- --text-muted color (pending/loading)
[--]     -- --text-secondary color (neutral/informational)
[!!]     -- --status-error color (error/critical)
[>>]     -- --signal color (active/in-progress)
```

Rendered in JetBrains Mono, `--label` size. Used in boot sequences, log output, status rows.

### Cursor / Caret

- Block cursor: `var(--signal)` background, `var(--bg)` text. Blinks at `1s steps(1)`.
- Line cursor: `2px solid var(--signal)`. Blinks at `1s steps(1)`.
- Only on elements that accept input. Never decorative.
- In light mode: cursor uses `--text-display` color instead of `--signal` if contrast is insufficient.
