import { registerCommand } from "./registry";
import { projects } from "@/data/projectsData";
import { blogPosts } from "@/data/blogData";
import type { Command } from "./types";

const ls: Command = {
  name: "ls",
  description: "List directory contents",
  completions: (partial) =>
    ["projects/", "posts/"].filter((c) => c.startsWith(partial)),
  execute: (args) => {
    const target = args[0]?.replace(/\/$/, "");

    if (!target) {
      return "README.md  projects/  posts/  resume.log  links.toml";
    }

    if (target === "projects") {
      return (
        <div className="space-y-0.5">
          {projects.map((p) => (
            <div key={p.slug} className="flex gap-4">
              <span className="text-accent/70 shrink-0" style={{ minWidth: 140 }}>
                {p.slug}
              </span>
              <span className="text-muted-foreground/40 shrink-0" style={{ minWidth: 80 }}>
                {p.status}
              </span>
              <span className="text-muted-foreground/40 shrink-0" style={{ minWidth: 50 }}>
                {p.year}
              </span>
              <span className="text-muted-foreground/30">
                {p.platforms.join(", ")}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (target === "posts") {
      return (
        <div className="space-y-0.5">
          {blogPosts.map((p) => (
            <div key={p.slug} className="flex gap-4">
              <span className="text-accent/70 shrink-0" style={{ minWidth: 140 }}>
                {p.slug}
              </span>
              <span className="text-muted-foreground/40 shrink-0" style={{ minWidth: 80 }}>
                {p.date}
              </span>
              <span className="text-muted-foreground/30">{p.category}</span>
            </div>
          ))}
        </div>
      );
    }

    return `ls: ${args[0]}: No such file or directory`;
  },
};

registerCommand(ls);
