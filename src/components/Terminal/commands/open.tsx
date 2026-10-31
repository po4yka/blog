import { registerCommand } from "@/lib/commands";
import { projects } from "@/data/projectsData";
import { blogPostsMeta as blogPosts } from "@/data/blogMeta";
import { postPath } from "@/lib/blog/paths";
import type { Command } from "@/lib/commands";

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
      return "open: missing operand. Try: open blog, open ratatoskr";
    }

    if (pages[target]) {
      ctx.navigate(pages[target]);
      return `Navigating to ${pages[target]}...`;
    }

    const path = postPath(blogPosts, target, ctx.getLocale());
    if (path) {
      ctx.navigate(path);
      const lang = path.startsWith("/blog/ru/") ? "ru" : "en";
      const post = blogPosts.find((p) => p.slug === target && (p.lang ?? "en") === lang);
      return `Opening post: ${post?.title ?? target}...`;
    }

    const project = projects.find((p) => p.slug === target);
    if (project) {
      ctx.navigate("/projects");
      return `Opening projects page...`;
    }

    return `open: ${target}: not found. Try: open blog, open ratatoskr`;
  },
};

registerCommand(open);
