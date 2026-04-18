import { registerCommand } from "./registry";
import { projects } from "@/data/projectsData";
import { blogPosts } from "@/data/blogData";
import { Accent } from "../ui";
import type { Command } from "./types";

function highlight(text: string, keyword: string) {
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
  const idx = lower.indexOf(kw);
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <Accent>{text.slice(idx, idx + keyword.length)}</Accent>
      {text.slice(idx + keyword.length)}
    </>
  );
}

function matches(text: string, keyword: string) {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

const grep: Command = {
  name: "grep",
  description: "Search posts or projects by keyword",
  completions: (partial, args) => {
    if (args.length >= 1) {
      return ["posts/", "projects/"].filter((c) => c.startsWith(partial));
    }
    return [];
  },
  execute: (args) => {
    if (args.length < 2) {
      return "Usage: grep <keyword> posts/ | grep <keyword> projects/";
    }

    const keyword = args[0]!;
    const target = args[1]!.replace(/\/$/, "");

    if (target === "posts") {
      const found = blogPosts.filter(
        (p) =>
          matches(p.title, keyword) ||
          matches(p.summary, keyword) ||
          p.tags.some((t) => matches(t, keyword)),
      );

      if (found.length === 0) {
        return `No posts matching "${keyword}"`;
      }

      return (
        <div className="space-y-0.5">
          {found.map((p) => (
            <div key={p.slug} className="flex gap-4">
              <span className="text-foreground font-medium shrink-0" style={{ minWidth: 140 }}>
                {p.slug}
              </span>
              <span className="text-muted-foreground/50">
                {highlight(p.title, keyword)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (target === "projects") {
      const found = projects.filter(
        (p) =>
          matches(p.name, keyword) ||
          matches(p.description, keyword) ||
          p.tags.some((t) => matches(t, keyword)),
      );

      if (found.length === 0) {
        return `No projects matching "${keyword}"`;
      }

      return (
        <div className="space-y-0.5">
          {found.map((p) => (
            <div key={p.slug} className="flex gap-4">
              <span className="text-foreground font-medium shrink-0" style={{ minWidth: 140 }}>
                {p.slug}
              </span>
              <span className="text-muted-foreground/50">
                {highlight(p.description, keyword)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return `grep: ${args[1]}: No such directory. Try: posts/ or projects/`;
  },
};

registerCommand(grep);
