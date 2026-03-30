import { registerCommand } from "./registry";
import { projects } from "@/components/projectsData";
import { blogPosts } from "@/components/blogData";
import { Accent, Tag } from "../primitives";
import type { Command } from "./types";

const allSlugs: string[] = [
  "README.md",
  ...projects.map((p) => p.slug).filter((s): s is string => s != null),
  ...blogPosts.map((p) => p.slug),
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="text-muted-foreground/40 shrink-0" style={{ minWidth: 80 }}>
        {label}
      </span>
      <span className="text-foreground/70">{children}</span>
    </div>
  );
}

const cat: Command = {
  name: "cat",
  description: "View file or entry details",
  completions: (partial) => allSlugs.filter((s) => s.startsWith(partial)),
  execute: (args) => {
    const target = args[0];

    if (!target) {
      return "cat: missing operand";
    }

    if (target === "README.md") {
      return "Mobile Developer -- Android, iOS, KMP, MobileOps";
    }

    const project = projects.find((p) => p.slug === target);
    if (project) {
      return (
        <div className="space-y-0.5">
          <Row label="name">
            <Accent>{project.name}</Accent>
          </Row>
          <Row label="desc">{project.description}</Row>
          <Row label="platforms">{project.platforms.join(", ")}</Row>
          <Row label="year">{project.year}</Row>
          <Row label="status">{project.status}</Row>
          <Row label="tags">
            <span className="flex gap-1.5 flex-wrap">
              {project.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </span>
          </Row>
          {project.links.length > 0 && (
            <Row label="links">
              {project.links.map((l, i) => (
                <span key={l.type}>
                  {i > 0 && <span className="text-muted-foreground/20"> | </span>}
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent/60 hover:text-accent transition-colors"
                  >
                    {l.type}
                  </a>
                </span>
              ))}
            </Row>
          )}
        </div>
      );
    }

    const post = blogPosts.find((p) => p.slug === target);
    if (post) {
      return (
        <div className="space-y-0.5">
          <Row label="title">
            <Accent>{post.title}</Accent>
          </Row>
          <Row label="date">{post.date}</Row>
          <Row label="category">{post.category}</Row>
          <Row label="summary">{post.summary}</Row>
          <Row label="tags">
            <span className="flex gap-1.5 flex-wrap">
              {post.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </span>
          </Row>
        </div>
      );
    }

    return `cat: ${target}: No such file or directory`;
  },
};

registerCommand(cat);
