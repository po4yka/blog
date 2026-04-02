// Static data for public site build. Admin manages equivalent data in D1.
import type { Role, SkillGroup } from "@/types";

export type { Role, SkillGroup };

export const roles: Role[] = [
  {
    period: "2023 — Present",
    company: "Freelance / Independent",
    title: "Mobile Engineer & Consultant",
    description:
      "Building apps and tooling for clients. Focus on KMP architecture, release automation, and CI/CD pipelines for mobile teams.",
    tags: ["KMP", "MobileOps", "Architecture"],
    highlights: [
      "Designed shared KMP modules for three client projects",
      "Built release automation pipelines reducing deploy time by 70%",
      "Consulting on modularization strategy for a 500k LOC Android codebase",
    ],
    location: "Remote",
  },
  {
    period: "2021 — 2023",
    company: "Tech Company",
    title: "Senior Android Developer",
    description:
      "Led the Android platform team. Migrated from XML to Compose, built modularization strategy, reduced build times by 40%.",
    tags: ["Android", "Compose", "Gradle"],
    highlights: [
      "Migrated 80+ screens from XML to Jetpack Compose",
      "Built convention plugins for consistent multi-module setup",
      "Reduced CI build times from 18 min to 7 min with caching and parallelization",
      "Mentored two junior developers through promotion cycle",
    ],
  },
  {
    period: "2019 — 2021",
    company: "Startup",
    title: "Mobile Developer",
    description:
      "Full-cycle mobile development for a product-stage startup. Built features across Android and iOS, set up CI/CD from scratch.",
    tags: ["Android", "iOS", "CI/CD"],
    highlights: [
      "Shipped Android and iOS apps from zero to production",
      "Set up GitHub Actions CI/CD with Fastlane for both platforms",
      "Implemented offline-first sync architecture with conflict resolution",
    ],
  },
  {
    period: "2018 — 2019",
    company: "University / Open Source",
    title: "Junior Developer",
    description:
      "Started contributing to open source Android libraries. Built first production app. Learned Kotlin, RxJava, and clean architecture.",
    tags: ["Kotlin", "Open Source"],
    highlights: [
      "Published first open-source Android library (200+ stars)",
      "Contributed to AndroidX and several community libraries",
    ],
  },
];

export const skills: SkillGroup[] = [
  { label: "Languages", items: ["Kotlin", "Swift", "TypeScript", "Dart"] },
  { label: "Android", items: ["Jetpack Compose", "Coroutines", "Hilt/Koin", "Room", "Gradle"] },
  { label: "iOS", items: ["SwiftUI", "UIKit", "Combine", "CoreData", "SPM"] },
  { label: "Cross-platform", items: ["Kotlin Multiplatform", "Ktor", "SQLDelight"] },
  { label: "DevOps", items: ["GitHub Actions", "Fastlane", "Firebase", "Gradle Build Cache"] },
  { label: "Tools", items: ["Android Studio", "Xcode", "Figma", "Git", "Docker"] },
];
