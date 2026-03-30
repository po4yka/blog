---
name: add-blog-post
description: "Create a new blog post with correct MDX frontmatter, static data entry, and content collection registration. Use when writing or adding any blog content. Ensures the post appears correctly on both the static site and in the admin panel's data source."
user-invocable: true
argument-hint: "<post-title>"
---

# Add Blog Post

Create a new blog post. Posts exist in two sources that must stay in sync.

## Dual-Source Architecture

| Source | Purpose | Format |
|--------|---------|--------|
| `src/content/blog/<slug>.mdx` | Astro content collection (static build) | MDX with YAML frontmatter |
| `src/components/blogData.ts` | Static data for island components | TypeScript object array |

Both sources must contain the same post metadata. The MDX file is the source of truth for content; `blogData.ts` provides data to React islands at build time.

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

## Step 2: Add to blogData.ts

Add an entry to the `blogPosts` array in `src/components/blogData.ts`:

```typescript
{
  slug: "kmp-shared-logic-without-shared-ui",
  title: "KMP: Shared Logic Without Shared UI",
  date: "Feb 2026",
  summary: "How we structured a KMP project to share networking and domain logic while keeping native views.",
  tags: ["KMP", "Architecture"],
  category: "Architecture",
  featured: true,
  content: `The full post content as a template literal string.

## Subheading

Body text...`,
},
```

The `content` field contains the full post body as a template literal (backtick string). Keep it identical to the MDX body content.

## Existing Categories

Check `db/seed.sql` or the admin panel for current categories. Known categories:
- Architecture
- DevOps
- Mobile
- Performance
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
- [ ] Entry added to `src/components/blogData.ts` with matching metadata
- [ ] Content in both sources is identical
- [ ] Copy passes anti-AI-slop check (no generic phrases)
- [ ] Summary is 1-2 concrete sentences
- [ ] Title is specific and human-sounding
