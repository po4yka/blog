---
name: add-blog-post
description: "Create a new blog post with correct MDX frontmatter and auto-generated data files. Use when writing or adding any blog content. MDX is the source of truth; data files are generated automatically."
user-invocable: true
argument-hint: "<post-title>"
---

# Add Blog Post

Create a new blog post. MDX files are the source of truth; `src/data/blogData.ts` is auto-generated from them.

## Architecture

| Source | Purpose | Editable? |
|--------|---------|-----------|
| `src/content/blog/<slug>.mdx` | Astro content collection (static build) | Yes -- source of truth |
| `src/data/blogData.ts` | Static data for React island components | No -- auto-generated via `npm run generate:blog` |

Never edit `blogData.ts` manually. Create or edit the MDX file, then run the generation script.

## Step 1: Create MDX File

English posts live under `src/content/blog/en/<slug>.mdx`. Russian translations go under `src/content/blog/ru/<slug>.mdx` with the same slug.

```mdx
---
title: "Post Title Here"
date: "Mon YYYY"
publishedAt: "2026-04-01"
summary: "One or two sentences. Concrete and specific."
tags: ["KMP", "Architecture"]
category: "Architecture"
featured: false
---

Post content in Markdown here.

## Subheading

Body text...
```

### Frontmatter Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | Clear, specific -- not SEO bait |
| `date` | string | Yes | Human display label. Format: `"Mon YYYY"` (e.g., `"Feb 2026"`) |
| `publishedAt` | ISO date | Yes | `YYYY-MM-DD`. Used for JSON-LD `datePublished`, RSS `pubDate`, `<time dateTime>`. Day defaults to `01` when only month is known |
| `updatedAt` | ISO date | No | Add when editing a shipped post. Drives JSON-LD `dateModified` |
| `summary` | string | Yes | 1-2 sentences, concrete. Also used for RSS description and `og:description` |
| `tags` | string[] | Yes | Use existing tags when possible |
| `category` | string | Yes | Must match an existing category |
| `featured` | boolean | No | Default false. Only 1-2 posts should be featured |
| `readingTime` | number | No | Minutes. Generator computes this if omitted |

Do **not** drop `publishedAt`. `BlogPosting` JSON-LD, RSS feeds, and semantic `<time dateTime>` all depend on it. Human `date` is only for display in post chrome.

### Slug Convention

The filename (without `.mdx`) becomes the slug. Use kebab-case:
- `kmp-shared-logic-without-shared-ui.mdx` -> slug: `kmp-shared-logic-without-shared-ui`

Both language variants must share the same slug so self-referential `hreflang` pairs correctly.

## Step 2: Generate Blog Data + OG Image

Run the full generator to rebuild `src/data/blogData.ts` and produce the per-post OG image:

```sh
npm run generate:all
```

Or run the blog-only step during quick iteration:

```sh
npm run generate:blog
```

Generators:
- `scripts/generate-blog-data.ts` — reads MDX frontmatter and writes the typed array to `src/data/blogData.ts`
- `scripts/generate-og-images.ts` — renders `/public/og/{lang}-{slug}.png` via Satori + Resvg (not runtime-renderable on Cloudflare Workers)

## Step 3: Validate Sync

Confirm the generated data matches the MDX source:

```sh
npm run validate:blog
```

This script (`scripts/validate-blog-sync.ts`) checks that every MDX file has a matching entry in `blogData.ts` and that metadata is consistent.

## Step 4: Discoverability Wiring (automatic)

These surfaces pick up the new post with no manual work, but verify after generation:

- `/blog/{slug}.md` (en) or `/blog/ru/{slug}.md` (ru) — raw markdown endpoint
- `/rss.xml` (en) or `/rss.ru.xml` (ru) — feed entry
- `/llms-full.txt` — content included in the aggregate dump
- Sitemap entry (via `@astrojs/sitemap`)
- `BlogPosting` JSON-LD on the post page with ISO dates
- `/og/{lang}-{slug}.png` used as `og:image` and `twitter:image`
- Self-referential `hreflang` + `x-default` in `<head>`; translated pair is linked when the sibling `{en,ru}/{slug}.mdx` exists

## Existing Categories

Current categories (from `db/seed.sql`):
- All
- Architecture
- DevOps
- Android
- iOS
- Tooling

Add new categories to `db/seed.sql` if needed:
```sql
INSERT OR IGNORE INTO categories (name) VALUES ('<NewCategory>');
```

## Existing Tags

Common tags used in the project:
- KMP, Compose, SwiftUI, Architecture
- CI/CD, MobileOps, Fastlane, GitHub Actions
- Android, iOS, Kotlin, Swift
- Gradle, Testing, Performance

Reuse existing tags for consistency. New tags are fine when the topic is genuinely new.

## Content Writing Rules

Follow the project's anti-AI-slop guidelines from `docs/Guidelines.md`:

### Do

- Write in a calm, concise, technically confident voice
- Use concrete details from real engineering work
- Keep summaries short and intelligent
- Make titles feel like real blog posts, not SEO bait
- Show specific tools, frameworks, and decisions

### Do not use these phrases

- "passionate developer"
- "crafting digital experiences"
- "innovative solutions"
- "impactful products"
- "building the future"
- "full-stack of creativity and technology"
- Any generic self-promotional phrasing

### Tone examples

Bad: "In this post, we'll explore the fascinating world of mobile CI/CD and discover how to build an innovative pipeline."

Good: "Our mobile CI was slow and flaky. Here is how we cut build times from 45 minutes to 12 and stopped ignoring test failures."

## Checklist

- [ ] MDX file created under `src/content/blog/{en,ru}/<slug>.mdx`
- [ ] Slug matches filename (kebab-case); same slug across language variants
- [ ] `date` display label is `"Mon YYYY"`
- [ ] `publishedAt` is ISO `YYYY-MM-DD`
- [ ] `updatedAt` added (only when revising a shipped post)
- [ ] Category matches an existing category (or new one added to seed)
- [ ] Tags reuse existing tags where possible
- [ ] Run `npm run generate:all` to regenerate data files and OG image
- [ ] Run `npm run validate:blog` (or `npm run validate:all`) to confirm sync
- [ ] Copy passes anti-AI-slop check (no generic phrases)
- [ ] Summary is 1-2 concrete sentences
- [ ] Title is specific and human-sounding
- [ ] After `npm run build`, spot-check `/blog/{slug}.md`, `/rss.xml`, `/og/{lang}-{slug}.png`
