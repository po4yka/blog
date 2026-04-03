-- Auto-generated from source files. Do not edit manually.
-- Run "npm run generate:all" to regenerate.

-- Blog posts
INSERT INTO blog_posts (slug, title, date, summary, tags, category, content, featured) VALUES
('compose-stability-deep-dive', 'A Deep Dive into Compose Stability', 'Dec 2025',
 'Understanding the Compose compiler''s stability inference, why your composables recompose too often, and how to fix it without @Stable annotations everywhere.',
 '["Android","Compose"]', 'Android',
 'If you''ve ever wondered why your Compose UI feels sluggish, the answer is almost always unnecessary recomposition. The Compose compiler tries to skip recomposition for composables whose parameters haven''t changed — but it can only do this for "stable" types.

## What makes a type stable?

A type is stable if:
- All public properties are val (immutable)
- All property types are themselves stable
- It''s a primitive, String, or annotated with @Stable/@Immutable

## The problem

Data classes from your domain layer often aren''t stable — they might contain List&lt;T&gt;, Map&lt;K,V&gt;, or other types the compiler can''t verify as stable.

## Solutions (ranked by preference)

1. **Use kotlinx.collections.immutable** — ImmutableList and ImmutableMap are stable
2. **Structure your composable parameters** — pass primitives instead of complex objects
3. **Use @Stable annotation** — but only when you can guarantee the contract
4. **Use Compose compiler metrics** — to identify the actual problem spots

## Measuring

Enable Compose compiler metrics in your build.gradle:

The metrics report will show you exactly which composables are skippable and which aren''t. Fix the unstable ones first — the ones that recompose most frequently.', 0),

('gradle-build-time-optimization', 'Cutting Gradle Build Times in Half', 'Nov 2025',
 'Practical techniques for reducing Android build times: configuration cache, build cache, modularization, and avoiding common pitfalls.',
 '["Android","Tooling"]', 'Tooling',
 'Slow builds kill productivity. Here''s what actually worked for us when we needed to cut our 15-minute clean build down to something reasonable.

## Configuration cache

The Gradle configuration cache is the single biggest win. It caches the result of the configuration phase, so subsequent builds skip all that plugin initialization and dependency resolution.

Enable it in gradle.properties. Fix the incompatible plugins. It''s worth it.

## Build cache

Remote build cache means your CI builds warm the cache for everyone. A developer pulling main gets cache hits for all the modules they didn''t change.

## Modularization done right

Don''t modularize for modularization''s sake. Modularize along build boundaries — modules that change independently should be separate. This maximizes cache hits and enables parallel compilation.

## Results

- Clean build: 15 min → 8 min (modularization + parallel)
- Incremental build: 4 min → 45 sec (configuration cache)
- CI build: 12 min → 4 min (remote cache)

The investment was about two weeks of focused work. The payoff is every single day.', 0),

('ios-background-downloads-done-right', 'iOS Background Downloads Done Right', 'Oct 2025',
 'Implementing reliable background downloads on iOS using URLSession background configuration, handling edge cases, and keeping the user informed.',
 '["iOS","Swift"]', 'iOS',
 'Background downloads on iOS are deceptively complex. URLSession''s background configuration handles the heavy lifting, but the edge cases will get you.

## The basics

Create a URLSession with a background configuration. The system manages the download even if your app is suspended or terminated. When the download completes, the system relaunches your app to handle it.

## Edge cases that bit us

- Downloads resuming after app update (session identifier must be stable)
- Cellular vs WiFi policy changes mid-download
- Disk space running out during download
- User revoking background app refresh permission

## Our architecture

We built a DownloadManager that wraps URLSession and provides:
- Progress tracking via Combine publishers
- Automatic retry with exponential backoff
- Queue management (max 3 concurrent downloads)
- Persistent download state in CoreData

The key insight: treat the download manager as infrastructure, not a feature. It should be boring and reliable.', 0),

('kmp-shared-logic-without-shared-ui', 'KMP: Shared Logic Without Shared UI', 'Feb 2026',
 'How we structured a Kotlin Multiplatform project to share networking, caching, and domain logic while keeping native Compose and SwiftUI views on each platform.',
 '["KMP","Architecture"]', 'Architecture',
 'When we started our Kotlin Multiplatform project, the temptation was to share everything — including UI. We resisted that urge, and it turned out to be the right call.

## The approach

Our shared module handles three things: networking (Ktor), local caching (SQLDelight), and domain logic. Everything above that layer is platform-native.

On Android, we use Jetpack Compose. On iOS, SwiftUI. The shared Kotlin code compiles to a framework that iOS consumes directly.

## Why not share UI?

Compose Multiplatform is impressive, but our iOS users expect iOS-native behavior. Swipe-back navigation, platform haptics, accessibility patterns — these are hard to replicate in a cross-platform UI layer.

## Results

- 60% code sharing by line count
- Native feel on both platforms
- One team maintaining shared logic
- Platform teams focus on UI polish

The key insight: share the boring parts (networking, caching, business rules) and let each platform shine where it matters most.', 1),

('mobile-ci-that-actually-works', 'Mobile CI That Actually Works', 'Jan 2026',
 'A practical walkthrough of setting up CI/CD for a mobile project — Gradle caching, signing, distribution, and the mistakes I made along the way.',
 '["MobileOps","CI/CD"]', 'DevOps',
 'Mobile CI is harder than web CI. You''re dealing with signing certificates, provisioning profiles, Gradle daemons, Xcode build caches, and app distribution — all before your tests even run.

## The stack

- GitHub Actions for orchestration
- Gradle remote cache (self-hosted)
- Fastlane for iOS signing and distribution
- Custom Gradle plugin for Android variant management

## Key lessons

**Cache everything.** Gradle remote caching cut our Android build times from 12 minutes to 4. On iOS, derived data caching saves about 5 minutes per build.

**Separate signing from building.** Don''t bake certificates into your CI config. Use a dedicated signing step that pulls credentials from a vault.

**Fail fast.** Run lint and unit tests before the expensive build step. No point compiling a release APK if your code doesn''t pass ktlint.

## The pipeline

1. Lint + static analysis (2 min)
2. Unit tests (3 min)
3. Build debug variants (4 min)
4. Build release + sign (6 min)
5. Distribute to testers (1 min)

Total: ~16 minutes from push to testable build. Not perfect, but reliable.', 0);

-- Categories
INSERT INTO categories (name) VALUES
('All'), ('Android'), ('Tooling'), ('iOS'), ('Architecture'), ('DevOps');

-- Projects
INSERT INTO projects (id, name, description, platforms, tags, links, featured, sort_order) VALUES
('meridian', 'Meridian',
 'Cross-platform habit tracker built with Kotlin Multiplatform. Shared business logic, native UI on both platforms.',
 '["Android","iOS"]', '["KMP","Compose","SwiftUI","SQLDelight","Ktor"]',
 '[{"type":"GitHub","href":"#"},{"type":"Google Play","href":"#"},{"type":"App Store","href":"#"}]', 1, 0),
('deploybot', 'Deploybot',
 'Internal release automation tool for mobile teams. Manages build variants, signing configs, and distribution channels.',
 '["Android"]', '["MobileOps","Gradle Plugin","Internal Tooling","CLI","Fastlane"]',
 '[{"type":"GitHub","href":"#"}]', 0, 1),
('compose-metrics', 'Compose Metrics Dashboard',
 'Visualization tool for Jetpack Compose compiler metrics. Tracks recomposition counts, stability, and performance regressions.',
 '["Android"]', '["Compose","Performance","Tooling","Compiler Metrics"]',
 '[{"type":"GitHub","href":"#"},{"type":"Google Play","href":"#"}]', 0, 2),
('castaway', 'Castaway',
 'Podcast player with offline-first architecture. Background downloads, queue management, and playback speed control.',
 '["iOS"]', '["Swift","AVFoundation","CoreData","Offline-first"]',
 '[{"type":"GitHub","href":"#"},{"type":"App Store","href":"#"}]', 0, 3),
('kmp-starter', 'KMP Starter',
 'Opinionated project template for Kotlin Multiplatform apps. Pre-configured CI, dependency injection, and modular architecture.',
 '["Android","iOS"]', '["KMP","Template","Architecture","CI/CD"]',
 '[{"type":"GitHub","href":"#"}]', 0, 4),
('logline', 'Logline',
 'Structured logging library for Android with Timber-compatible API. Ships logs to remote collectors with batching and retry.',
 '["Android"]', '["Kotlin","Logging","Library","Timber"]',
 '[{"type":"GitHub","href":"#"}]', 0, 5);

-- Roles
INSERT INTO roles (id, period, company, title, description, tags, sort_order) VALUES
('freelance', '2023 — Present', 'Freelance / Independent', 'Mobile Engineer & Consultant',
 'Building apps and tooling for clients. Focus on KMP architecture, release automation, and CI/CD pipelines for mobile teams.',
 '["KMP","MobileOps","Architecture"]', 0),
('tech-company', '2021 — 2023', 'Tech Company', 'Senior Android Developer',
 'Led the Android platform team. Migrated from XML to Compose, built modularization strategy, reduced build times by 40%.',
 '["Android","Compose","Gradle"]', 1),
('startup', '2019 — 2021', 'Startup', 'Mobile Developer',
 'Full-cycle mobile development for a product-stage startup. Built features across Android and iOS, set up CI/CD from scratch.',
 '["Android","iOS","CI/CD"]', 2),
('university', '2018 — 2019', 'University / Open Source', 'Junior Developer',
 'Started contributing to open source Android libraries. Built first production app. Learned Kotlin, RxJava, and clean architecture.',
 '["Kotlin","Open Source"]', 3);

-- Site settings
INSERT INTO site_settings (id, name, handle, role, bio, github, email, telegram, linkedin) VALUES
(1, 'Nikita Pochaev', '@po4yka',
 'Mobile Developer — Android, iOS, Kotlin Multiplatform, MobileOps',
 'Mobile engineer focused on Android, iOS, and Kotlin Multiplatform. I care about clean architecture, reliable release pipelines, and tools that help teams ship better software.',
 'https://github.com/po4yka', 'hello@po4yka.dev', 'https://t.me/po4yka', 'https://linkedin.com/in/po4yka');
