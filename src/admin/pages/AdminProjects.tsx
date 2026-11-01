import { useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { useProjects } from "@/admin/hooks/useAdminQueries";

export function AdminProjects() {
  const { data: projects = [] } = useProjects();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[900px]">
      {/* Header */}
      <m.div
        className="flex items-center justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 600 }}>
            Projects
          </h1>
          <p className="font-mono text-muted-foreground/40 mt-0.5" style={{ fontSize: "max(11px, 0.6875rem)" }}>
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
      </m.div>

      {/* Project list */}
      <m.div
        className="border border-border/50 bg-card overflow-hidden"
        style={{ borderRadius: "2px" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {projects.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>No projects yet</p>
          </div>
        )}

        {projects.map((project, i) => (
          <div
            key={project.id}
            className="hover:bg-foreground/[0.015] transition-colors duration-200"
            style={{ borderBottom: i < projects.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              <button
                onClick={() => setExpanded(expanded === project.id ? null : project.id ?? null)}
                aria-label={expanded === project.id ? `Collapse ${project.name}` : `Expand ${project.name}`}
                aria-expanded={expanded === project.id}
                aria-controls={project.id ? `project-detail-${project.id}` : undefined}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {expanded === project.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {project.featured && <Star size={12} className="fill-foreground/20 shrink-0" />}

              <div className="flex-1 min-w-0">
                <h3 className="text-foreground truncate" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                  {project.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {project.platforms.map((p) => (
                    <span key={p} className="font-mono text-muted-foreground" style={{ fontSize: "max(11px, 0.6875rem)" }}>{p}</span>
                  ))}
                  <span className="text-border/50">·</span>
                  <span className="font-mono text-muted-foreground-dim" style={{ fontSize: "max(11px, 0.6875rem)" }}>
                    {project.tags.length} tags
                  </span>
                </div>
              </div>

            </div>

            {/* Expanded detail */}
            <AnimatePresence>
              {expanded === project.id && (
                <m.div
                  id={project.id ? `project-detail-${project.id}` : undefined}
                  className="grid overflow-hidden"
                  initial={{ opacity: 0, gridTemplateRows: "0fr" }}
                  animate={{ opacity: 1, gridTemplateRows: "1fr" }}
                  exit={{ opacity: 0, gridTemplateRows: "0fr" }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="min-h-0 overflow-hidden px-4 pb-4 pl-12">
                    <p className="text-foreground/80 mb-2" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {project.tags.map((tag) => (
                        <span key={tag} className="font-mono px-2 py-0.5 bg-secondary/60 text-foreground/80 border border-border/60" style={{ fontSize: "max(11px, 0.6875rem)", borderRadius: "2px" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {project.links.map((link) => (
                        <span key={link.href} className="font-mono text-muted-foreground" style={{ fontSize: "max(11px, 0.6875rem)" }}>
                          {link.type}: {link.href}
                        </span>
                      ))}
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </m.div>

    </div>
  );
}
