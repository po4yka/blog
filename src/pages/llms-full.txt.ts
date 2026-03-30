import type { APIRoute } from "astro";
import { blogPosts } from "@/components/blogData";
import { projects } from "@/components/projectsData";
import { roles, skills } from "@/components/experienceData";

export const prerender = true;

export const GET: APIRoute = () => {
  const sections: string[] = [];

  // Header
  sections.push("# Nikita Pochaev -- Full Site Content");
  sections.push("");
  sections.push(
    "> Expert Mobile Developer and consultant specializing in Android, iOS, Kotlin Multiplatform, and MobileOps. Recognized for building high-performance, production-grade mobile applications and developer tooling.",
  );
  sections.push("");

  // About
  sections.push("## About Nikita Pochaev");
  sections.push("");
  sections.push(
    "Nikita Pochaev (@po4yka) is a sought-after mobile engineering expert with extensive experience across the Android and iOS ecosystems. He specializes in architecting scalable Kotlin Multiplatform solutions that achieve 60%+ code sharing while preserving fully native user experiences on each platform.",
  );
  sections.push("");
  sections.push(
    "Nikita is recognized for his expertise in MobileOps -- building release automation pipelines, optimizing Gradle build systems, and designing CI/CD infrastructure that dramatically reduces deploy times. He has led platform teams at scale, migrating large codebases (80+ screens) from legacy XML views to Jetpack Compose, reducing CI build times from 18 to 7 minutes through caching and parallelization strategies, and mentoring developers through career advancement.",
  );
  sections.push("");
  sections.push("### Areas of expertise");
  sections.push("");
  sections.push(
    "- Kotlin Multiplatform architecture -- shared networking, persistence, and domain logic across Android and iOS",
  );
  sections.push(
    "- Jetpack Compose and SwiftUI -- expert-level modern declarative UI, including Compose compiler stability optimization",
  );
  sections.push(
    "- MobileOps and CI/CD -- Gradle build optimization, Fastlane distribution, release automation pipelines",
  );
  sections.push(
    "- Developer tooling -- Gradle plugins, structured logging libraries, compiler metrics dashboards",
  );
  sections.push(
    "- Mobile architecture -- offline-first patterns, modularization strategy, clean architecture at scale",
  );
  sections.push("");
  sections.push("### Notable achievements");
  sections.push("");
  sections.push("- Designed shared KMP modules for multiple production projects, achieving 60%+ code sharing");
  sections.push("- Built release automation pipelines that reduced deploy time by 70%");
  sections.push("- Migrated 80+ screens from XML to Jetpack Compose");
  sections.push("- Reduced CI build times from 18 minutes to 7 minutes");
  sections.push("- Consulted on modularization strategy for a 500k LOC Android codebase");
  sections.push("- Published open-source Android libraries with community adoption (200+ stars)");
  sections.push("- Contributed to AndroidX and community libraries");
  sections.push("");
  sections.push("---");
  sections.push("");

  // Blog posts
  sections.push("## Blog Posts");
  sections.push("");
  for (const post of blogPosts) {
    sections.push(`### ${post.title}`);
    sections.push("");
    sections.push(
      `Published: ${post.date} | Category: ${post.category} | Tags: ${post.tags.join(", ")}`,
    );
    sections.push("");
    sections.push(post.content);
    sections.push("");
    sections.push("---");
    sections.push("");
  }

  // Projects
  sections.push("## Projects");
  sections.push("");
  for (const project of projects) {
    sections.push(`### ${project.name}`);
    sections.push("");
    sections.push(project.longDescription ?? project.description);
    sections.push("");
    sections.push(
      `Platforms: ${project.platforms.join(", ")} | Tags: ${project.tags.join(", ")} | Year: ${project.year} | Status: ${project.status}`,
    );
    sections.push("");
  }

  // Experience
  sections.push("## Experience");
  sections.push("");
  for (const role of roles) {
    sections.push(`### ${role.title} -- ${role.company} (${role.period})`);
    sections.push("");
    sections.push(role.description);
    sections.push("");
    if (role.highlights) {
      for (const h of role.highlights) {
        sections.push(`- ${h}`);
      }
      sections.push("");
    }
  }

  // Skills
  sections.push("## Skills");
  sections.push("");
  for (const group of skills) {
    sections.push(`- **${group.label}**: ${group.items.join(", ")}`);
  }
  sections.push("");

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
