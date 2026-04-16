# Signal Deck -- Component Specifications

Component anatomy, states, and token mappings. Every component should feel like it belongs on a well-designed operator console: precise, functional, and visually calm until a signal demands attention.

---

## 1. CARDS / PANELS

Two modes: **editorial** (calm, breathing, content-focused) and **instrument** (dense, data-packed, telemetry-focused). The contrast between these modes is the layout rhythm.

**Editorial panel:**
- Background: `--surface`. Border: `1px solid --border` or none. Radius: 8-12px.
- Padding: 24px. Generous whitespace. Content flows vertically.
- Used for: descriptions, article blocks, settings sections.

**Instrument panel:**
- Background: `--surface`. Border: `1px solid --border-visible`. Radius: 4-6px.
- Padding: 12-16px. Dense content, character-cell aligned.
- Header: `--label` style (JetBrains Mono, ALL CAPS, `--text-secondary`), optional scanline-accent bg.
- Used for: telemetry readouts, status dashboards, system metrics.

**No shadows. Ever.** Elevation through background shift and borders only.

---

## 2. BUTTONS

| Variant | Background | Border | Text | Radius |
|---------|-----------|--------|------|--------|
| Primary | `--text-display` | none | `--bg` (inverted) | 999px (pill) |
| Secondary | transparent | `1px solid --border-visible` | `--text-primary` | 999px |
| Ghost | transparent | none | `--text-secondary` | 0 |
| Technical | `--surface-raised` | `1px solid --border-visible` | `--text-primary` | 2-4px |
| Destructive | transparent | `1px solid --status-error` | `--status-error` | 999px |
| Signal | `var(--signal-subtle)` | `1px solid var(--signal)` | `var(--signal)` | 999px |

All buttons: JetBrains Mono, 13px, ALL CAPS, letter-spacing 0.06em, padding 12px 24px. Min touch target: 44px.

- Hover: background brightens one step. No scale, no shadow.
- Disabled: opacity 0.35.
- Loading: text replaced with `[..]` or `LOADING...` -- never a spinner inside a button.

**Technical vs pill:** Use pill (999px) for user-facing actions (Submit, Save, Connect). Use technical (2-4px) for system actions (Run, Execute, Deploy, Reset) -- these should feel like hardware controls.

---

## 3. INPUTS

**Preferred style:** Underline input (bottom border only).

- Border: `1px solid --border-visible` bottom. Full-border variant: `--border-visible`, 4px radius.
- Label above: `--label` style (JetBrains Mono, ALL CAPS, `--text-secondary`).
- Input text: JetBrains Mono for data-entry fields, Inter for prose fields.
- Placeholder: `--text-muted`, regular case.
- Focus: bottom border -> `var(--signal)`. Full-border: all borders -> `var(--signal)`.
- Error: border -> `--status-error`, message below in `--status-error`, `--caption` size.
- Padding: 8px 0 (underline) or 8px 12px (full border). Height: 44px minimum.

**Command-input pattern:**
```
> [input text here]|
```
Prefix `>` in `--text-muted`, input in `--text-primary`, blinking cursor in `--signal`. Full-width, `--surface` background, `1px solid --border-visible` border, 2px radius. Used for search, command entry, terminal-style interactions.

---

## 4. STATUS ROWS / DATA ROWS

The workhorse component. Appears in lists, settings, dashboards.

**Anatomy:**
```
LABEL (left)                                VALUE (right)
```
- Label: JetBrains Mono, ALL CAPS, `--text-secondary`, left-aligned.
- Value: JetBrains Mono (numeric) or Inter (text), `--text-primary`, right-aligned.
- Divider below: `1px solid --border`, full-width.
- Row padding: 12-16px vertical.

**With status color:**
- Value inherits status color (`--status-ok`, `--status-warn`, `--status-error`).
- Label stays `--text-secondary`. Never color the label.
- Trend arrow (up/down) same color as value, adjacent.

**With inline bar:**
- Value + compact progress bar (4-6px height) stacked on right side.
- Bar: `--text-display` fill, `--border` remainder.

**Hierarchical rows:**
- Sub-items indented 16-24px. Same divider treatment.
- No tree lines, no expand/collapse icons -- indentation IS the hierarchy.

---

## 5. DATA TABLES

- Header row: `--label` style (JetBrains Mono, ALL CAPS, `--text-secondary`). Bottom border: `1px solid --border-visible`.
- Cell text: JetBrains Mono for numbers/IDs/codes. Inter for names/descriptions.
- Cell padding: 12px 16px.
- Numbers: right-aligned, tabular figures. Text: left-aligned.
- Row dividers: `1px solid --border`. No zebra striping. No cell backgrounds.
- Active/selected row: `--surface-raised` background + left `2px solid var(--signal)` indicator.
- Sortable columns: append `^` or `v` character to header label. Active sort: `--text-display`.

---

## 6. SEGMENTED TELEMETRY BARS (Signature Component)

The signature data visualization. Discrete rectangular segments with gaps -- mechanical, instrument-like.

**Anatomy:**
```
LABEL                                        VALUE / MAX
[|||||||||||           ] or [||||||||||||||||||||]
```

- Label + value above the bar, in standard stat-row layout.
- Bar: full-width row of discrete rectangular segments with 2px gaps.
- Segments: square-ended blocks, no border-radius.
- Filled: solid status color or `--text-display` (neutral).
- Empty: `--border` (dark) or `#E0E0E0` (light).

**Status encoding:**

| State | Fill Color | When |
|-------|-----------|------|
| Neutral | `--text-display` | Within normal range |
| Good | `--status-ok` | Healthy, under limit |
| Caution | `--status-warn` | Approaching limit |
| Over limit | `--status-error` | Exceeds target |

**Overflow:** Filled segments continue past the "100%" mark in `--status-error`. The bar grows beyond its expected width to visualize over-allocation.

**Sizes:** Hero 16-20px height, Standard 8-12px, Compact 4-6px.

Always pair with numeric readout. Bar = proportion; number = precision.

---

## 7. NAVIGATION

**Desktop:** Horizontal text bar. Labels: JetBrains Mono, ALL CAPS, `--label` size.
- Active: `--text-display` + 2px underline in `var(--signal)`.
- Inactive: `--text-secondary`. Hover: `--text-primary`.
- Separator: `|` pipe character in `--text-muted`, or 24px spacing.
- Optional bracket format: `[ ACTIVE ]  ITEM  ITEM`

**Mobile:** Bottom bar, same label style. Active: dot indicator below in `var(--signal)`.

**Back button:** Text-based `< BACK` in JetBrains Mono, `--text-secondary`. Or minimal chevron `<` in a 40-44px circle, `--surface` background, `1px solid --border-visible`.

---

## 8. TAGS / CHIPS

- Border: `1px solid --border-visible`. No fill. Radius: 999px (pill) or 2px (technical).
- Text: JetBrains Mono, `--caption` size, ALL CAPS.
- Color: `--text-secondary`. Active/selected: `--text-display` border + text.
- Padding: 4px 12px. Min height: 24px.
- Signal variant: `1px solid var(--signal)`, text in `var(--signal)`. For active filters, current state.
- Never: filled backgrounds, gradient chips, multi-color tag systems.

---

## 9. SEGMENTED CONTROL

- Container: `1px solid --border-visible`, pill (999px) or 8px radius.
- Active segment: `--text-display` background, `--bg` text (inverted).
- Inactive: transparent background, `--text-secondary` text.
- Text: JetBrains Mono, ALL CAPS, `--label` size.
- Height: 36-44px. Max segments: 2-4.
- Transition: 150ms `--ease-out`. No sliding indicator -- instant background swap or `steps(1)`.

---

## 10. TOGGLES / SWITCHES

- Track: pill shape. Off: `--border-visible` border, `--surface-raised` fill. On: `--text-display` fill.
- Thumb: circle. Off: `--text-muted`. On: `--bg` (inverted).
- Minimum touch target: 44px.
- Transition: 150ms. Mechanical -- quick snap, not springy.
- Signal variant: On state uses `var(--signal)` track fill instead of `--text-display`.

---

## 11. PROMPT-LINE / COMMAND INPUT

The terminal-native input pattern. Different from standard inputs.

**Anatomy:**
```
[PREFIX] [INPUT AREA                              ]|
```

- Fixed to bottom or dedicated input zone.
- Prefix: `>`, `$`, `::`, or `[LABEL]` in `--text-muted`, JetBrains Mono.
- Input: `--text-primary`, JetBrains Mono. Full-width.
- Cursor: block or line in `var(--signal)`, blinking `1s steps(1)`.
- Background: `--surface`. Border: `1px solid --border-visible` top (if at bottom) or all sides.
- Height: 44-48px. Padding: 12px 16px.

**Multi-line variant:** For longer input. Same styling. Auto-grows. Max height before scroll: 4 lines.

**Autocomplete:** Dropdown below/above prompt. `--surface-raised`, `1px solid --border-visible`, 4px radius. Items: 44px height, `--text-primary`. Selected: `--surface` background + left `2px solid var(--signal)`.

---

## 12. STATUS-LINE

A persistent narrow bar showing system state. Always at a screen edge (top or bottom).

**Anatomy:**
```
MODE   |  LOCATION  |  STATUS  |  TIMESTAMP
```

- Height: 28-32px. Background: `--surface` or `--bg`.
- Text: JetBrains Mono, `--label` size, ALL CAPS, `--text-secondary`.
- Separator: `|` pipe in `--text-muted`.
- Active/highlighted segment: `--text-display`.
- Signal indicator: small dot (6px) in `var(--signal)` for connected/active states.
- Border: `1px solid --border` on the edge facing content.

---

## 13. LOG / OUTPUT ZONE

Scrollable area for sequential output -- logs, history, activity feed.

**Anatomy per line:**
```
[TIMESTAMP]  [PREFIX]  CONTENT
```

- Timestamp: JetBrains Mono, `--caption`, `--text-muted`, fixed-width column (80-100px).
- Prefix: `[OK]`, `[--]`, `[!!]`, `[>>]` in status color, `--label` size.
- Content: Inter or JetBrains Mono depending on content type. `--text-primary`.
- Line divider: none (rely on line-height spacing) or `1px solid --border` every 5-10 lines.
- New entries: fade in from opacity 0, 150ms `--ease-out`.

**Boot sequence variant:** Lines reveal one-by-one with 30-50ms stagger. Each line starts at opacity 0 and fades to full. Timestamps increment realistically.

---

## 14. OVERLAYS / MODALS

No shadows. Layering through backdrop dimming and border contrast.

**Modal:**
- Backdrop: `rgba(0,0,0,0.75)` (dark mode), `rgba(0,0,0,0.5)` (light mode).
- Dialog: `--surface`, `1px solid --border-visible`, 12px radius. Max width: 480px. Centered.
- Title: `--heading` size, Inter Medium. Close: `[X]` ghost button, top-right.
- Enter: fade in 200ms. Exit: fade out 150ms. No slide, no scale.

**Bottom sheet:**
- `--surface`, 12px top-radius, `1px solid --border-visible` top.
- Handle: 32px wide, 2px tall, `--border-visible`, centered, 8px from top.
- Drag-to-dismiss supported.

**Dropdown / popover:**
- `--surface-raised`, `1px solid --border-visible`, 6px radius.
- Items: 44px height. Selected: left `2px solid var(--signal)`.
- No shadow. Appears/disappears instantly or 100ms fade.

---

## 15. CHARTS / DATA VISUALIZATION

- **Line charts:** 1.5-2px stroke in `--text-display`. Average/reference dashed 1px `--text-secondary`. Grid: `--border`, horizontal only. Axis labels: JetBrains Mono, `--caption`. No area fill.
- **Bar charts:** Vertical bars, `--text-display` fill, `--border` background track. Square ends (no radius). Gap between bars: 2-4px.
- **Sparklines:** 1.5px stroke, `--text-primary`. No axes, no labels. Inline with metrics. Optional endpoint dot in `var(--signal)`.
- **Ring/arc gauges:** Thin stroke (4-6px), tick marks optional. Numeric readout centered or adjacent.
- **Differentiation order:** Opacity (100/60/30) -> dash pattern (solid/dashed/dotted) -> line weight (2px/1px) -> color (last resort).
- **Rule:** Always show numeric value alongside any visualization. The chart shows shape; the number provides precision.
- Label data series directly on the chart. No separate legend boxes.

---

## 16. EMPTY / LOADING / ERROR / SUCCESS STATES

**Empty state:**
- Centered in container. 96px+ vertical padding.
- Headline: `--text-secondary`, `--subheading` size.
- Description: 1 sentence, `--text-muted`, `--body-sm`.
- Optional: dot-grid background in the empty zone.
- Optional: single action button (secondary variant).
- Never: mascots, illustrations, multi-paragraph explanations.

**Loading:**
- Segmented spinner: 8-12 discrete segments in a ring, rotating in `steps()`. Not smooth.
- Or: bracket text `[LOADING...]` in JetBrains Mono, `--text-muted`, at the location where content will appear.
- Or: segmented progress bar + percentage for determinate loading.
- Never: skeleton screens, smooth spinners, pulsing dots.

**Error:**
- Input-level: border -> `--status-error`, message below: `[ERR] Description` in `--status-error`, `--caption`.
- Form-level: summary panel `1px solid --status-error`, 4px radius, with error list.
- Inline: `[!!] Error description` prefix pattern.
- Never: red backgrounds, alert banners, toast popups.

**Success:**
- Inline: `[OK] Saved` or `[OK] Connected` in `--status-ok`, JetBrains Mono, `--caption`.
- Appears at the trigger location. Auto-dismiss after 3s (fade out).
- Never: green backgrounds, confetti, check-mark animations.

---

## 17. PROGRESS / DIAGNOSTIC WIDGETS

**Determinate progress:**
- Segmented telemetry bar (Section 6) with percentage readout.
- Or: text-only `[43%] PROCESSING...` in JetBrains Mono.

**Multi-metric dashboard card:**
- `--surface` panel, `1px solid --border-visible`, 6px radius.
- Panel header: JetBrains Mono, ALL CAPS, `--label`, `--text-secondary`. Optional scanline-accent.
- Hero metric: IBM Plex Mono Light, `--display-lg` size, `--text-display`.
- Unit: `--label` size, adjacent to metric.
- Secondary stats: 2-3 stat rows below.
- Status: color on the value, not the panel.

**System status grid:**
- Grid of small instrument panels, each with: label, value, optional inline bar or status dot.
- 2-3 columns on desktop, 1 column mobile.
- All panels same height within a row.

---

## 18. CURSOR / SCAN-UPDATE MOTIFS

These are interaction-level patterns, not component types.

**Block cursor:**
- `var(--signal)` background, `var(--bg)` text character.
- Blink: `opacity 0/1` at `1s steps(1)`.
- Used on: active command-input, focused search, any "awaiting input" state.
- Never on: static text, decorative elements, non-interactive content.

**Scan-line update:**
- When a value updates, briefly highlight the row/cell: `var(--signal-subtle)` background, fading to transparent over 300ms.
- Used for: real-time data feeds, live telemetry, updating counters.
- The highlight sweeps horizontally (left-to-right, 200ms) then fades (100ms).

**Type-on reveal:**
- Text appears character-by-character, 20-40ms per character.
- Used sparingly: hero moments, first-load welcome text, dramatic reveals.
- Never for: body content, navigation, repeated interactions.

---

## Decision: Editorial vs Instrument

When composing a screen, decide per-section which mode applies:

| Context | Mode | Characteristics |
|---------|------|-----------------|
| Blog post, description, about page | Editorial | Inter body, generous spacing, 8-12px radius, breathing room |
| Dashboard metric, status panel, telemetry | Instrument | JetBrains Mono data, dense spacing, 4-6px radius, character-cell rhythm |
| Settings, preferences | Editorial | Clean list with clear labels, standard row height |
| System log, activity feed | Instrument | Mono text, timestamps, status prefixes, dense rows |
| Navigation, headers | Either | Match the dominant mode of the page content |

A single screen can mix both modes. The transition between an editorial section and an instrument section IS a compositional device -- use it deliberately with clear spatial separation (`--space-7` or wider).
