# Background Styles — on-brand subset

Six showcase backgrounds for Gemini's Nano Banana renderer. This is a trimmed subset of the upstream 12-style list. The other six (`fluid`, `analog_liquid`, `led_matrix`, `iridescent`, `morning`, `ui_container`) were removed because each violates `DESIGN.md` — they introduce chromatic accent, iridescence, glow, pastel, or gradients, all banned from this project's surface.

The same six keys appear in `scripts/generate_showcase.py` (`BACKGROUND_STYLES` dict). Keep both files in sync.

## Dark styles

### 1. THE VOID — key `void`
**Concept**: Absolute minimalism and mystery.

**Visual characteristics**:
- Base: pure black (`#000000`)
- Noise: extremely fine silver/white high-contrast micro noise
- Texture: cold, sharp electronic film grain
- Atmosphere: minimal — only a faint icy white glow at one extreme corner
- Mood: infinite void, distant starlight at the universe's edge

**Suitable for**: hardcore infra, data security, ops tooling, developer CLIs.

**Saturation**: ≤ 5%.

---

### 2. FROSTED HORIZON — key `frosted`
**Concept**: Modern breathing space with physical thickness.

**Visual characteristics**:
- Base: deep titanium gray or midnight slate gray (never pure black)
- Noise: organic film-like dust texture
- Texture: unpolished rough metal or stone surface
- Atmosphere: large neutral-grey halo, edges dissolved like mist (no blue cast — override from upstream)
- Mood: sophisticated, breathable, premium

**Suitable for**: premium tooling, design-minded brands, restrained tech.

**Saturation**: ≤ 10%, neutral only.

---

### 3. STUDIO SPOTLIGHT — key `spotlight`
**Concept**: Physical studio lighting simulation.

**Visual characteristics**:
- Base: extremely dark warm carbon gray
- Noise: slightly larger grain simulating low-light photography
- Texture: paper print grain in weak light
- Atmosphere: single-side softbox creating natural vignette
- Mood: editorial magazine quality, professional photography

**Suitable for**: editorial brands, writing tools, magazine-style presentations.

**Saturation**: 0%.

---

## Light styles

### 4. EDITORIAL PAPER — key `editorial`
**Concept**: High-end specialty paper with extreme whitespace.

**Visual characteristics**:
- Base: off-white, alabaster, or pearl white (never pure white)
- Noise: high-grade watercolor or rough art paper texture
- Texture: physical paper tactile suggestion
- Atmosphere: natural light diffuse reflection, slight warm gray vignette at corners
- Mood: humanistic, independent magazine aesthetic

**Suitable for**: writing, editorial, human-centered products.

**Saturation**: ≤ 5%, warm neutral only.

---

### 5. CLINICAL STUDIO — key `clinical`
**Concept**: Spatial order with high contrast.

**Visual characteristics**:
- Base: pure white or extremely light cold gray
- Noise: high-frequency sharp cold-toned digital micro noise
- Texture: enhanced sharpness
- Atmosphere: pure light/shadow structure — large softbox creating smooth gray-white gradient
- Mood: sterile space, geometric order, 3D depth in 2D

**Suitable for**: developer tools, algorithm-driven, confident neutral brands.

**Saturation**: ≤ 2%.

---

### 6. SWISS FLAT — key `swiss_flat`  *(project-default)*
**Concept**: Absolute flatness and timeless authority.

**Visual characteristics**:
- Base: 100% pure solid colour — pick ONE of the project tokens: `#141416` (card), `#f5f3ee` (paper), `#101012` (ink), `#e9e8e4` (eggshell). No vintage greens, burgundies, or navies from upstream — these are out.
- Noise: none
- Texture: none
- Atmosphere: zero gradients, zero effects — just colour + shape
- Mood: extreme confidence, classic authority

**Suitable for**: anything. When in doubt, use this.

**Saturation**: 0%. Pure neutral only.

---

## Selection guide

### By product type

| Product type | Recommended styles |
| --- | --- |
| Infrastructure / security / ops | VOID, FROSTED HORIZON, SWISS FLAT (`#141416`) |
| Developer tools / algorithm-driven | CLINICAL STUDIO, SWISS FLAT, VOID |
| Design / editorial | FROSTED HORIZON, EDITORIAL PAPER, STUDIO SPOTLIGHT |
| Writing / humanist | EDITORIAL PAPER, STUDIO SPOTLIGHT |
| Classic / timeless | SWISS FLAT, EDITORIAL PAPER |

### By mood

| Mood | Recommended styles |
| --- | --- |
| Cold / rational | VOID, CLINICAL STUDIO |
| Warm / approachable | EDITORIAL PAPER |
| Atmospheric / moody | FROSTED HORIZON |
| Professional / editorial | STUDIO SPOTLIGHT, EDITORIAL PAPER |
| Classic / timeless | SWISS FLAT, EDITORIAL PAPER |

### By contrast

| Contrast | Styles |
| --- | --- |
| High | VOID, CLINICAL STUDIO, SWISS FLAT |
| Medium | FROSTED HORIZON |
| Low | EDITORIAL PAPER |

### By complexity

| Complexity | Styles |
| --- | --- |
| Minimal | VOID, SWISS FLAT, CLINICAL STUDIO |
| Moderate | FROSTED HORIZON, EDITORIAL PAPER |

## Implementation notes

All six styles:
1. **Strictly neutral.** Saturation ≤ 10%, no chromatic cast.
2. **Fine noise where applicable** — adds physical quality without decoration.
3. **Micro-typography.** Geist Sans or Geist Mono only. Never Inter, never JetBrains Mono. Tiny text (6–9pt) in corners.
4. **Breathing space.** Generous negative space around the mark (40%+ of canvas unused).
5. **Adaptive logo colour.** Dark backgrounds → white mark; light backgrounds → black mark. `swiss_flat` follows the luminance of the chosen token.

## Banned (do NOT re-add)

| Upstream key | Why banned in this project |
| --- | --- |
| `fluid` | Deep purple / Klein blue base — chromatic accent forbidden. |
| `analog_liquid` | Vivid orange / blue / green + iridescent metallic — double violation. |
| `led_matrix` | Glowing dot matrix, cyberpunk — glow + neon forbidden. |
| `iridescent` | Holographic light purple / light blue / soft pink — chromatic + iridescence. |
| `morning` | Pastel colour dissolve — chromatic. |
| `ui_container` | Gradient base + frosted glass + rounded corners — multi-violation. |

If a new background need arises, add a new neutral style in `DESIGN.md` first, then mirror the key here and in `scripts/generate_showcase.py`.
