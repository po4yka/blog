# logo-generator (po4yka.dev adaptation)

Adapted from [op7418/logo-generator-skill](https://github.com/op7418/logo-generator-skill). This copy is scoped to this project and constrained to `DESIGN.md` / `docs/Guidelines.md`.

## What this skill does here

- Generate 6+ variants of a monochrome SVG mark for a project, app, or brand in this repo
- Use `currentColor` throughout so the mark inherits the site's `var(--foreground)`
- Optionally render showcase presentations via Gemini's Nano Banana model (`gemini-3.1-flash-image-preview`) against one of 6 on-brand neutral backgrounds

Invoke by describing what you need — e.g. "generate a logo for a Kotlin MobileOps CLI called signal" — or by referring to it as `logo-generator`.

## Intentional deviations from upstream

These are deliberate adaptations; don't revert them without editing `DESIGN.md` first.

| Upstream | Here | Why |
| --- | --- | --- |
| 12 showcase backgrounds | 6 | The other six (`fluid`, `analog_liquid`, `led_matrix`, `iridescent`, `morning`, `ui_container`) require purple, iridescence, neon glow, pastel, or gradients — all banned by `DESIGN.md`. |
| Default style `iridescent` | `swiss_flat` | Pure flat on a project token colour is the on-brand default. |
| Inter + JetBrains Mono in showcase HTML | Geist Sans + Geist Mono | Site typography is Geist across the board. |
| 8px border-radius + glow hover aura | 2px radii, hairline rules, opacity-only hover | Matches operator-panel kit in `DESIGN.md`. |
| `references/webgl_backgrounds.md` + `assets/background_library.html` | Not installed | Every WebGL shader uses iridescence / holographic / spiral colour-bands — not salvageable. |
| Showcase prompt suggests Inter/Helvetica/Geist typography | Pins Geist and adds explicit "no chromatic cast" instructions per style | Tighter guardrails for Nano Banana drift. |

## Setup (one-time, only if you want phase 4)

```bash
cd .claude/skills/logo-generator
pip install -r requirements.txt   # cairosvg, google-genai, python-dotenv, pillow
cp .env.example .env              # edit .env and add GEMINI_API_KEY
```

Skipping setup still lets you use phases 1–3 (SVG generation and the interactive HTML gallery). Phase 4 (Gemini renders) is optional.

## Files

```
logo-generator/
├── SKILL.md                      # workflow adapted for this project
├── README.md                     # this file
├── requirements.txt              # python deps (cairosvg, google-genai, ...)
├── .env.example                  # env template — copy to .env locally (gitignored)
├── .gitignore                    # keeps .env + output/ out of git
├── scripts/
│   ├── svg_to_png.py             # cairosvg wrapper, unchanged from upstream
│   └── generate_showcase.py      # Nano Banana showcase renderer, trimmed to 6 styles
├── references/
│   ├── design_patterns.md        # SVG pattern library (unchanged from upstream)
│   └── background_styles.md      # reduced to 6 on-brand backgrounds
└── assets/
    └── showcase_template.html    # Geist + 2px radii + neutral palette + no glow
```

## Upstream

Attribution and upstream tracking: <https://github.com/op7418/logo-generator-skill>.
