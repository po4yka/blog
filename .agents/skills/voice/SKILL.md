---
name: voice
description: "Write or review user-facing copy on po4yka.dev in English and Russian. Load for changes to src/lib/i18n.ts, src/content/*.json, MDX frontmatter text (title, summary), public/llms.txt, src/pages/llms-full.txt.ts, JSON-LD descriptions, and feat/fix/perf commit subjects (they appear on /changelog)."
---

# Voice (po4yka.dev)

Source: `docs/Guidelines.md`, "Brand and tone guidelines" and "Blog and content guidelines". Use `site-design` for visual rules.

## The voice

The voice is calm, concise, precise, human, technically confident and understated. It reads as written by a mobile engineer who ships. It does not read as a SaaS page, an agency template, a motivational brand page or an AI summary of a developer profile. Name the real thing: the tool, the layer, the failure. Do not describe how good the work is.

## Good lines that exist today

Copy these moves. Do not copy the words into new places.

- `src/lib/i18n.ts`, `hero.intro`: "I build Android and Kotlin Multiplatform apps and the systems that ship them: CI pipelines, release automation, developer tooling, and lately the AI layer around all of it." It names the work and the date of the change ("lately").
- `src/content/projects.json`, `anr-watchdog`: "Android library with Java-level ANR monitor and C++ native signal handler for catching events the JVM monitor misses." It states what the code does and where it differs.
- `src/content/blog/en/network-isnt-broken-just-here.mdx`, `summary`: "A phone connects over Wi-Fi but not mobile data, and the same connections die every time." It starts from the symptom.
- `src/content/blog/ru/network-isnt-broken-just-here.mdx`, `summary`: "Телефон подключается по Wi-Fi, но не по мобильной сети, и отваливаются всегда одни и те же соединения." The Russian is written for Russian readers. It is not a word-by-word copy of the English.

## Bad patterns that exist today

Fix these when you touch the file. Do not copy them.

| Where | Text | Why it fails |
|---|---|---|
| `src/lib/i18n.ts`, `about.p1` | "cares equally about the code ... the invisible infrastructure that lets a team ship with confidence" | Claims a value. It names no fact. "Ship with confidence" is a stock phrase. |
| `src/lib/i18n.ts`, `about.p2suffix` | "I like teams that deploy often and debug rarely." | Slogan cadence. No fact behind it. |
| `public/llms.txt`, About | "deep expertise", "architects scalable ... solutions" | Hype adjectives. The reader cannot check them. |
| `public/llms.txt` | "60%+ code sharing", "cut deploy times by 70%" | Percentages that no file in `src/content/` backs. |
| `src/lib/i18n.ts` | "coming soon" (`links.comingSoon`, `experiencePage.comingSoon`) | A placeholder on a live page. |
| `src/components/ProjectsPageIsland.tsx`, `src/components/ExperiencePageIsland.tsx` | "Loaded po4yka.dev/projects" | Narrates a page load (see `site-design`). |

## Rules

1. Every number must exist in `src/content/*.json`, an MDX file or generated repo data. If you cannot point to the source, delete the number.
2. Say each fact once per page. Hero, about, spec sheet, meta row and footer must not repeat each other.
3. No hype adjectives: passionate, innovative, scalable, robust, seamless, powerful, cutting-edge, deep expertise, impactful. `docs/Guidelines.md` also bans "crafting digital experiences" and "building the future".
4. No "not X, but Y" cadence ("not just an app, but a platform"). State Y.
5. No placeholders and no "coming soon". Remove the slot or fill it with a real link.
6. Use one role string: "AI Engineer & Senior Mobile Developer" (`hero.role`). Use the term "Kotlin Multiplatform". Do not write "KMM" or "Kotlin Multiplatform Mobile" in new text. Existing uses in `i18n.ts` and `llms.txt` should move to the one term when you edit them.
7. Write Russian as Russian. Re-think the sentence. Keep tool names in Latin script (Gradle, Kotlin, CI). Do not translate word by word.
8. Do not use emoji. Do not use exclamation marks.
9. Write English documentation in ASD-STE100 Simplified Technical English. Blog posts and personal copy may keep a human rhythm, but stay concrete.

## Banned phrases

| English | Russian equivalent |
|---|---|
| passionate developer | увлечённый разработчик |
| innovative solutions | инновационные решения |
| cutting-edge, state-of-the-art | передовой, современный подход |
| seamless | бесшовный |
| powerful | мощный |
| revolutionary, game-changing | революционный |
| impactful products | значимые продукты |
| ship with confidence | выпускать с уверенностью |
| deep expertise | глубокая экспертиза |
| building the future | строим будущее |
| crafting digital experiences | создаю цифровой опыт |

Add a phrase here only if it appears in real copy and a rule above does not cover it.

## Commit subjects shown on /changelog

`/changelog` lists only `feat`, `fix` and `perf` subjects, grouped per day (`AGENTS.md`, "Content pipeline"). Write the subject for a reader of the site.

- Name the concrete change: "fix(home): show GitHub activity without a GraphQL token".
- Avoid vague verbs and nouns: elevate, enhance, improve, polish, refine, various, misc, tweaks, updates.
- One change per subject. Use Conventional Commits. No emoji.
- Do not mention internal tools or review steps in the subject.

## Before you finish

- [ ] Each number has a source file.
- [ ] No banned phrase, no placeholder, no "not X, but Y".
- [ ] The role string and "Kotlin Multiplatform" match `i18n.ts` and `JsonLd.astro`.
- [ ] The EN and RU text both exist and say the same facts.
- [ ] A new commit subject names the change.
