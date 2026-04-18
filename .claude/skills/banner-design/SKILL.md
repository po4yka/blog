---
name: banner-design
description: "Design banners for social media, ads, website heroes, creative assets, and print. Multiple art direction options. Actions: design, create, generate banner. Platforms: Facebook, Twitter/X, LinkedIn, YouTube, Instagram, Google Display, website hero, print. Styles: minimalist, gradient, bold typography, photo-based, geometric, retro, editorial, collage. Uses ui-ux-pro-max and frontend-design skills."
argument-hint: "[platform] [style] [dimensions]"
license: MIT
metadata:
  author: claudekit
  version: "1.0.0"
---

> **Project Override:** Banners for this project use the neutral greyscale palette — `#0b0b0c` graphite dark or `#f5f3ee` warm paper light, eggshell (`#e9e8e4`) or ink (`#101012`) text, no chromatic accent (emphasis is `--emphasis` white/black plus weight + underline). Typography: Geist Sans for chrome and Geist Mono for operator labels; Piazzolla belongs on blog post bodies only and should not appear on banners. Flat operator panels with 1px hairline borders, 2px radius, no shadows, no traffic lights. See `DESIGN.md` for the full design system. The `ai-artist` and `ai-multimodal` skills referenced below are not installed in this project -- use alternative image generation methods or create HTML/CSS-only banners.

# Banner Design - Multi-Format Creative Banner System

Design banners across social, ads, web, and print formats. Generates multiple art direction options per request with AI-powered visual elements. This skill handles banner design only. Does NOT handle video editing, full website design, or print production.

## When to Activate

- User requests banner, cover, or header design
- Social media cover/header creation
- Ad banner or display ad design
- Website hero section visual design
- Event/print banner design
- Creative asset generation for campaigns

## Workflow

### Step 1: Gather Requirements (AskUserQuestion)

Collect via AskUserQuestion:
1. **Purpose** — social cover, ad banner, website hero, print, or creative asset?
2. **Platform/size** — which platform or custom dimensions?
3. **Content** — headline, subtext, CTA, logo placement?
4. **Brand** — existing brand guidelines? (check `docs/Guidelines.md` and `DESIGN.md`)
5. **Style preference** — any art direction? (show style options if unsure)
6. **Quantity** — how many options to generate? (default: 3)

### Step 2: Research & Art Direction

1. Activate `ui-ux-pro-max` skill for design intelligence
2. Review project design system in `DESIGN.md` for brand constraints
3. Select 2-3 complementary art direction styles from references:
   `references/banner-sizes-and-styles.md`

### Step 3: Design & Generate Options

For each art direction option:

1. **Create HTML/CSS banner** using `frontend-design` skill
   - Use exact platform dimensions from size reference
   - Apply safe zone rules (critical content in central 70-80%)
   - Max 2 typefaces, single CTA, 4.5:1 contrast ratio
   - Inject brand context via `.claude/skills/brand-system/scripts/inject-brand-context.cjs`

2. **Visual elements** -- Create with HTML/CSS or use external image generation tools as needed. The `ai-artist` and `ai-multimodal` skills are not available in this project.

3. **Compose final banner** -- overlay text, CTA, logo on visual elements in HTML/CSS

### Step 4: Export Banners to Images

After designing HTML banners, export each to PNG:

1. **Serve HTML files** via local server (python http.server or similar)
2. **Screenshot each banner** at exact platform dimensions using Chrome DevTools MCP:
   - Use `resize_page` to set exact dimensions (e.g., 1500x500 for Twitter header)
   - Use `navigate_page` to open the banner HTML
   - Use `take_screenshot` to capture the banner as PNG
3. **Save** exported files to `assets/banners/{campaign}/`

**Output path convention** (per `assets-organizing` skill):
```
assets/banners/{campaign}/
├── minimalist-1500x500.png
├── gradient-1500x500.png
├── bold-type-1500x500.png
├── minimalist-1080x1080.png    # if multi-size requested
└── ...
```

- Use kebab-case for filenames: `{style}-{width}x{height}.{ext}`
- Date prefix for time-sensitive campaigns: `{YYMMDD}-{style}-{size}.png`
- Campaign folder groups all variants together

### Step 5: Present Options & Iterate

Present all exported images side-by-side. For each option show:
- Art direction style name
- Exported PNG preview (use `ai-multimodal` skill to display if needed)
- Key design rationale
- File path & dimensions

Iterate based on user feedback until approved.

## Banner Size Quick Reference

| Platform | Type | Size (px) | Aspect Ratio |
|----------|------|-----------|--------------|
| Facebook | Cover | 820 × 312 | ~2.6:1 |
| Twitter/X | Header | 1500 × 500 | 3:1 |
| LinkedIn | Personal | 1584 × 396 | 4:1 |
| YouTube | Channel art | 2560 × 1440 | 16:9 |
| Instagram | Story | 1080 × 1920 | 9:16 |
| Instagram | Post | 1080 × 1080 | 1:1 |
| Google Ads | Med Rectangle | 300 × 250 | 6:5 |
| Google Ads | Leaderboard | 728 × 90 | 8:1 |
| Website | Hero | 1920 × 600-1080 | ~3:1 |

Full reference: `references/banner-sizes-and-styles.md`

## Art Direction Styles (Top 10)

| Style | Best For | Key Elements |
|-------|----------|--------------|
| Minimalist | SaaS, tech | White space, 1-2 colors, clean type |
| Bold Typography | Announcements | Oversized type as hero element |
| Gradient | Modern brands | Mesh gradients, chromatic blends |
| Photo-Based | Lifestyle, e-com | Full-bleed photo + text overlay |
| Geometric | Tech, fintech | Shapes, grids, abstract patterns |
| Retro/Vintage | F&B, craft | Distressed textures, muted colors |
| Glassmorphism | SaaS, apps | Frosted glass, blur, glow borders |
| Neon/Cyberpunk | Gaming, events | Dark bg, glowing neon accents |
| Editorial | Media, luxury | Grid layouts, pull quotes |
| 3D/Sculptural | Product, tech | Rendered objects, depth, shadows |

Full 22 styles: `references/banner-sizes-and-styles.md`

## Design Rules

- **Safe zones**: critical content in central 70-80% of canvas
- **CTA**: one per banner, bottom-right, min 44px height, action verb
- **Typography**: max 2 fonts, min 16px body, ≥32px headline
- **Text ratio**: under 20% for ads (Meta penalizes heavy text)
- **Print**: 300 DPI, CMYK, 3-5mm bleed
- **Brand**: always inject via `.claude/skills/brand-system/scripts/inject-brand-context.cjs`
