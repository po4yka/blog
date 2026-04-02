// Auto-generated from MDX content files. Do not edit manually.
// Run "npm run generate:blog" to regenerate.
import type { BlogPost } from "@/types";

export type { BlogPost };

export const blogPosts: BlogPost[] = [
  {
    slug: "kmp-shared-logic-without-shared-ui",
    title: "KMP: Shared Logic Without Shared UI",
    date: "Feb 2026",
    summary:
      "How we structured a Kotlin Multiplatform project to share networking, caching, and domain logic while keeping native Compose and SwiftUI views on each platform.",
    tags: ["KMP", "Architecture"],
    category: "Architecture",
    featured: true,
    content: `When we started our Kotlin Multiplatform project, the temptation was to share everything — including UI. We resisted that urge, and it turned out to be the right call.

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

The key insight: share the boring parts (networking, caching, business rules) and let each platform shine where it matters most.`,
  },
  {
    slug: "mobile-ci-that-actually-works",
    title: "Mobile CI That Actually Works",
    date: "Jan 2026",
    summary:
      "A practical walkthrough of setting up CI/CD for a mobile project — Gradle caching, signing, distribution, and the mistakes I made along the way.",
    tags: ["MobileOps", "CI/CD"],
    category: "DevOps",
    content: `Mobile CI is harder than web CI. You're dealing with signing certificates, provisioning profiles, Gradle daemons, Xcode build caches, and app distribution — all before your tests even run.

## The stack

- GitHub Actions for orchestration
- Gradle remote cache (self-hosted)
- Fastlane for iOS signing and distribution
- Custom Gradle plugin for Android variant management

## Key lessons

**Cache everything.** Gradle remote caching cut our Android build times from 12 minutes to 4. On iOS, derived data caching saves about 5 minutes per build.

**Separate signing from building.** Don't bake certificates into your CI config. Use a dedicated signing step that pulls credentials from a vault.

**Fail fast.** Run lint and unit tests before the expensive build step. No point compiling a release APK if your code doesn't pass ktlint.

## The pipeline

1. Lint + static analysis (2 min)
2. Unit tests (3 min)
3. Build debug variants (4 min)
4. Build release + sign (6 min)
5. Distribute to testers (1 min)

Total: ~16 minutes from push to testable build. Not perfect, but reliable.`,
  },
  {
    slug: "compose-stability-deep-dive",
    title: "A Deep Dive into Compose Stability",
    date: "Dec 2025",
    summary:
      "Understanding the Compose compiler's stability inference, why your composables recompose too often, and how to fix it without @Stable annotations everywhere.",
    tags: ["Android", "Compose"],
    category: "Android",
    content: `If you've ever wondered why your Compose UI feels sluggish, the answer is almost always unnecessary recomposition. The Compose compiler tries to skip recomposition for composables whose parameters haven't changed — but it can only do this for "stable" types.

## What makes a type stable?

A type is stable if:
- All public properties are val (immutable)
- All property types are themselves stable
- It's a primitive, String, or annotated with @Stable/@Immutable

## The problem

Data classes from your domain layer often aren't stable — they might contain List<T>, Map<K,V>, or other types the compiler can't verify as stable.

## Solutions (ranked by preference)

1. **Use kotlinx.collections.immutable** — ImmutableList and ImmutableMap are stable
2. **Structure your composable parameters** — pass primitives instead of complex objects
3. **Use @Stable annotation** — but only when you can guarantee the contract
4. **Use Compose compiler metrics** — to identify the actual problem spots

## Measuring

Enable Compose compiler metrics in your build.gradle:

The metrics report will show you exactly which composables are skippable and which aren't. Fix the unstable ones first — the ones that recompose most frequently.`,
  },
  {
    slug: "gradle-build-time-optimization",
    title: "Cutting Gradle Build Times in Half",
    date: "Nov 2025",
    summary:
      "Practical techniques for reducing Android build times: configuration cache, build cache, modularization, and avoiding common pitfalls.",
    tags: ["Android", "Tooling"],
    category: "Tooling",
    featured: false,
    content: `Slow builds kill productivity. Here's what actually worked for us when we needed to cut our 15-minute clean build down to something reasonable.

## Configuration cache

The Gradle configuration cache is the single biggest win. It caches the result of the configuration phase, so subsequent builds skip all that plugin initialization and dependency resolution.

Enable it in gradle.properties. Fix the incompatible plugins. It's worth it.

## Build cache

Remote build cache means your CI builds warm the cache for everyone. A developer pulling main gets cache hits for all the modules they didn't change.

## Modularization done right

Don't modularize for modularization's sake. Modularize along build boundaries — modules that change independently should be separate. This maximizes cache hits and enables parallel compilation.

## Results

- Clean build: 15 min → 8 min (modularization + parallel)
- Incremental build: 4 min → 45 sec (configuration cache)
- CI build: 12 min → 4 min (remote cache)

The investment was about two weeks of focused work. The payoff is every single day.`,
  },
  {
    slug: "ios-background-downloads-done-right",
    title: "iOS Background Downloads Done Right",
    date: "Oct 2025",
    summary:
      "Implementing reliable background downloads on iOS using URLSession background configuration, handling edge cases, and keeping the user informed.",
    tags: ["iOS", "Swift"],
    category: "iOS",
    content: `Background downloads on iOS are deceptively complex. URLSession's background configuration handles the heavy lifting, but the edge cases will get you.

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

The key insight: treat the download manager as infrastructure, not a feature. It should be boring and reliable.`,
  },
];

export const categories = ["All", "Architecture", "DevOps", "Android", "Tooling", "iOS"];
