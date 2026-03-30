import { registerCommand } from "./registry";
import { projects } from "@/components/projectsData";
import { blogPosts } from "@/components/blogData";
import type { Command } from "./types";

const pages: Record<string, string> = {
  home: "/",
  projects: "/projects",
  experience: "/experience",
  blog: "/blog",
  settings: "/settings",
};

const allTargets: string[] = [
  ...Object.keys(pages),
  ...projects.map((p) => p.slug).filter((s): s is string => s != null),
  ...blogPosts.map((p) => p.slug),
];

const open: Command = {
  name: "open",
  description: "Navigate to a page or entry",
  completions: (partial) => allTargets.filter((t) => t.startsWith(partial)),
  execute: (args, ctx) => {
    const target = args[0];

    if (!target) {
      return "open: missing operand. Try: open blog, open meridian";
    }

    if (pages[target]) {
      ctx.navigate(pages[target]);
      return `Navigating to ${pages[target]}...`;
    }

    const post = blogPosts.find((p) => p.slug === target);
    if (post) {
      ctx.navigate(`/blog/${post.slug}`);
      return `Opening post: ${post.title}...`;
    }

    const project = projects.find((p) => p.slug === target);
    if (project) {
      ctx.navigate("/projects");
      return `Opening projects page...`;
    }

    return `open: ${target}: not found. Try: open blog, open meridian`;
  },
};

registerCommand(open);
