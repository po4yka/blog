---
name: logo-generator
description: >
  Generate SVG logos and (optionally) Gemini-rendered showcase presentations, constrained to this project's Swiss + operator-console design language. Use when the user wants to create a logo or mark for a project, app, or brand in this repo; generate multiple concept variants; export SVG + PNG assets; or render professional showcase images against neutral backgrounds. Enforces the project design system: no chromatic accent, no gradients, no glow or phosphor effects, Geist typography, 2px radii, hairline rules. Showcase generation uses Gemini 3.1 Flash Image Preview (Nano Banana) and requires a local GEMINI_API_KEY — skip phase 4 if none is configured.
---

# Logo Generator (po4yka.dev adaptation)

Adapted from [op7418/logo-generator-skill](https://github.com/op7418/logo-generator-skill). The workflow is the same; the design constraints are tightened to match `DESIGN.md` and `docs/Guidelines.md`.

## Non-negotiable project constraints

Before generating anything, read `DESIGN.md` at the repo root. The generated logo and any surrounding presentation MUST satisfy:

- **No chromatic accent.** Only `--foreground` / `--background` / `--emphasis` / `--muted-foreground`. No purple, teal, amber, blue, green, or any colored accent family.
- **No gradients.** Solid fills only. SVG `<linearGradient>` / `<radialGradient>` are forbidden in the logo itself.
- **No glow / `filter="url(#...)"` drop shadows / `text-shadow` / phosphor / halo.** Flat geometric forms only.
- **No pill radii.** Any container radius in presentation HTML is exactly `2px`.
- **Geist typography.** Geist Sans for body + headings, Geist Mono for metadata, Geist Pixel for decorative counters only. Never Inter, never JetBrains Mono.
- **Hairline rules.** Dividers are `1px solid var(--rule)` (not shadows, not thick borders).
- **Restrained motion.** Press feedback is `active:opacity-70`. Never `scale`, `translate`, `rotate` on hover.

If the user asks for a logo with a specific brand colour that is not already in the project token set, generate the base mark in `currentColor` and note that any colourisation is the consumer's responsibility — do not hardcode chromatic fills.

## Workflow

### Phase 1: Information gathering

Collect the minimum needed to generate variants:

1. **Product / brand name** (required)
2. **Industry / category** (e.g. AI tooling, mobile app, infrastructure, writing)
3. **Core concept** (one word: connection, flow, stack, signal, archive, pulse)
4. **Constraints** the user has beyond the project design system (e.g. must read at 16×16, must pair with an existing wordmark, must avoid a specific shape)

Ask 2–3 concise questions, not a questionnaire.

### Phase 2: SVG generation

Generate **at least 6 distinct variants** from `references/design_patterns.md`. Variants must feel categorically different (not parameter tweaks of one form).

Per-variant SVG rules:

- `viewBox="0 0 100 100"` — fixed. No other viewBox.
- Fill and stroke values use `currentColor` only. No hex, no `rgb()`, no named colours.
- Stroke width between **2 and 4 units** (sits well with hairline project rules).
- **Negative space ≥ 40%** of the canvas. Count occupied area; if the mark fills more than 60%, rebuild it.
- One or two core forms. Never three or more unrelated shapes.
- Prefer geometric primitives (`<circle>`, `<rect>`, `<line>`, `<polygon>`, `<path>` with straight segments and simple bezier) over decorative paths.
- No gradients, no filters, no masks-for-glow, no `stroke-dasharray` animation. A static `<animate>` or `<animateTransform>` on rotation is acceptable only if the user explicitly asks for motion.
- Group related elements inside `<g>` with a meaningful label via `<title>`.

Present variants in an interactive HTML page built from `assets/showcase_template.html` (already adapted for this project — Geist, 2px radii, hairline rules, no glow). For each variant include:

- the SVG at 128px
- a one-sentence design rationale
- a label of the pattern family (Dots, Lines, Geometric, Network, Mixed)

### Phase 3: Iteration

Let the user:

- narrow from 6+ to 2–3 picks
- adjust proportions, stroke weight, rotation
- combine elements across variants
- generate additional variants inside a specific direction

Make targeted edits. Do not regenerate the full set unless asked.

### Phase 4: Showcase generation (optional — requires GEMINI_API_KEY)

Only proceed if the user wants rendered presentation images AND a Gemini key is configured in `.env`.

1. **Export PNG** via `scripts/svg_to_png.py`. Default 1024×1024, transparent background.
2. **Pick styles** from the six on-brand backgrounds in `references/background_styles.md`:

   | Key | Best for |
   | --- | --- |
   | `swiss_flat` | Default — pure flat on a project token colour. Hardest to get wrong. |
   | `editorial` | Warm paper, humanist feel — pairs well with writing / editorial products. |
   | `clinical` | Pure white studio — pairs well with tooling, developer products. |
   | `void` | Pure black — hardcore infra / security / ops brands. |
   | `frosted` | Titanium grey with neutral haze — premium, restrained tech. |
   | `spotlight` | Carbon grey with vignette — editorial magazine feel. |

   Typical set: pick 3–4. **Do not** re-enable the six banned styles (`fluid`, `analog_liquid`, `led_matrix`, `iridescent`, `morning`, `ui_container`) — they have been removed from `scripts/generate_showcase.py` because they violate the project design system.

3. **Generate** with `python scripts/generate_showcase.py <name> <reference.png> --style <key>` per style, or `--all-styles` to render all six.

4. **Compose** the final presentation page using the adapted `assets/showcase_template.html` — the template already uses Geist, 2px radii, and the project token palette.

### Phase 5: Delivery

Hand the user:

- one interactive HTML page showing variants + selected showcase images
- the raw SVG files (editable)
- 1024×1024 PNG exports (add `--width 2048 --height 2048` for high-DPI)
- showcase PNGs for chosen styles
- a short README.md summarising the chosen mark, negative-space guard (e.g. "min 16px clear space = 2 units at 100 viewBox")

## Technical notes

### Python environment

The two scripts under `scripts/` need Python 3.8+ and these packages:

```bash
cd .claude/skills/logo-generator
pip install -r requirements.txt   # cairosvg, google-genai, python-dotenv, pillow
cp .env.example .env              # then edit .env and add GEMINI_API_KEY
```

The `.env` file is in the skill's `.gitignore`. Never commit it.

### Showcase model

Default model is `gemini-3.1-flash-image-preview` (Nano Banana). Override via `GEMINI_MODEL`. Both the official Google endpoint and third-party proxies work — set `GEMINI_API_BASE_URL` for a proxy.

### Output sizes

- SVG logos: authored at `viewBox="0 0 100 100"`, scale-free.
- PNG exports: 1024×1024 by default. For favicons, also export 32×32 and 16×16 and verify the mark still reads at 16px — if not, the mark is too complex, go back to phase 3.
- Showcase renders: 16:9 aspect ratio at 2K resolution (hardcoded in `generate_showcase.py`).

## Common patterns (quick reference)

All examples use `currentColor` — they inherit the surrounding `var(--foreground)` in the project's React components.

### Concentric dots
```svg
<svg viewBox="0 0 100 100">
  <g>
    <circle cx="50" cy="38" r="3" fill="currentColor"/>
    <!-- add more dots in a disciplined ring -->
  </g>
</svg>
```

### Geometric with line accent
```svg
<svg viewBox="0 0 100 100">
  <polygon points="50,30 70,60 30,60" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="50" cy="30" r="4" fill="currentColor"/>
</svg>
```

### Node network
```svg
<svg viewBox="0 0 100 100">
  <path d="M 30 70 Q 50 70, 50 50 T 70 30" stroke="currentColor" stroke-width="2" fill="none"/>
  <circle cx="30" cy="70" r="4" fill="currentColor"/>
  <circle cx="50" cy="50" r="5" fill="currentColor"/>
  <circle cx="70" cy="30" r="4" fill="currentColor"/>
</svg>
```

For more pattern families see `references/design_patterns.md`.

## Troubleshooting

- **SVG not displaying correctly:** check `viewBox` and that every `<path>` is closed.
- **PNG export fails:** `pip install cairosvg`; on macOS cairosvg needs `brew install cairo pango` if the wheel didn't cover it.
- **Showcase generation fails:**
  - Check `.env` has a valid `GEMINI_API_KEY`.
  - Verify the reference PNG exists and is readable.
  - Check Gemini quota and rate limits.
- **Third-party endpoint not working:** `GEMINI_API_BASE_URL` must include the version segment, e.g. `https://api.example.com/v1`.
- **Model renders in colour anyway:** the prompt pins `pure white` or `pure black` logo; if Nano Banana drifts, re-run — the output is non-deterministic. If it drifts consistently, use `swiss_flat` which has the tightest instruction set.

## What this skill is NOT for

- Full brand identity systems (typography, colour scales, voice) — use `/brand-system`.
- Presentation banner design — use `/banner-design`.
- Illustration or iconography beyond a single mark — outside scope.
- Re-enabling the banned background styles. The trim to 6 is intentional; edit `DESIGN.md` first if you need to widen it.
