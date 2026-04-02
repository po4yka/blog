---
name: add-blog-post
description: "Create a new blog post with correct MDX frontmatter, static data entry, and content collection registration. Use when writing or adding any blog content. Ensures the post appears correctly on both the static site and in the admin panel's data source."
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

Create `src/content/blog/<slug>.mdx`:

```mdx
---
title: "Post Title Here"
date: "Mon YYYY"
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
| `date` | string | Yes | Format: `"Mon YYYY"` (e.g., `"Feb 2026"`) |
| `summary` | string | Yes | 1-2 sentences, concrete |
| `tags` | string[] | Yes | Use existing tags when possible |
| `category` | string | Yes | Must match an existing category |
| `featured` | boolean | No | Default false. Only 1-2 posts should be featured |

### Slug Convention

The filename (without `.mdx`) becomes the slug. Use kebab-case:
- `kmp-shared-logic-without-shared-ui.mdx` -> slug: `kmp-shared-logic-without-shared-ui`

## Step 2: Generate Blog Data

Run the generation script to rebuild `src/data/blogData.ts` from MDX files:

```sh
npm run generate:blog
```

This reads all MDX frontmatter from `src/content/blog/` and writes the typed array to `src/data/blogData.ts`. The script is at `scripts/generate-blog-data.ts`.

## Step 3: Validate Sync

Confirm the generated data matches the MDX source:

```sh
npm run validate:blog
```

This script (`scripts/validate-blog-sync.ts`) checks that every MDX file has a matching entry in `blogData.ts` and that metadata is consistent.

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

- [ ] MDX file created at `src/content/blog/<slug>.mdx`
- [ ] Slug matches filename (kebab-case)
- [ ] Date format is `"Mon YYYY"`
- [ ] Category matches an existing category (or new one added to seed)
- [ ] Tags reuse existing tags where possible
- [ ] Run `npm run generate:blog` to regenerate `src/data/blogData.ts`
- [ ] Run `npm run validate:blog` to confirm sync
- [ ] Copy passes anti-AI-slop check (no generic phrases)
- [ ] Summary is 1-2 concrete sentences
- [ ] Title is specific and human-sounding
