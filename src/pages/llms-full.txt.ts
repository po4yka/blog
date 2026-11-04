import type { APIRoute } from "astro";
import { blogPosts } from "@/data/blogData";
import { projects } from "@/data/projectsData";
import { roles, skills } from "@/data/experienceData";
import { stripMdxSyntax } from "@/lib/blog/mdx-text";
import { t } from "@/lib/i18n";

export const prerender = true;

export const GET: APIRoute = () => {
  const sections: string[] = [];

  // Header
  sections.push("# Nikita Pochaev -- Full Site Content");
  sections.push("");
  sections.push(`> ${t("en", "hero.role")}. ${t("en", "hero.intro")}`);
  sections.push("");

  // About: only facts from the content sources. The Experience section below has the record.
  const currentRoles = roles.filter((role) => role.period.endsWith("Present"));
  sections.push("## About Nikita Pochaev");
  sections.push("");
  sections.push(`Nikita Pochaev (@po4yka). Based in ${currentRoles[0]?.location ?? roles[0]?.location}.`);
  sections.push("");
  sections.push("Current roles:");
  sections.push("");
  for (const role of currentRoles) {
    sections.push(`- ${role.title} at ${role.company} (${role.period})`);
  }
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
    sections.push(stripMdxSyntax(post.content));
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
