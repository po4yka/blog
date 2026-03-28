import { motion } from "motion/react";
import { Github, ExternalLink } from "lucide-react";
import { BootBlock, Cmd, Accent, Tag, MacWindow } from "./Terminal";
import { ProcessTable, UptimeStrip } from "./Decorations";
import { useInView } from "./useInView";
import { projects, type Project } from "./projectsData";

const mono = "'JetBrains Mono', monospace";
const ease = [0.25, 0.46, 0.45, 0.94] as const;

function ProjectEntry({ project, index }: { project: Project; index: number }) {
  const { ref, inView } = useInView(0.08);

  return (
    <motion.div
      ref={ref}
      className="py-5 border-b border-border/40 last:border-b-0 -mx-2 px-2 group"
      style={{ fontFamily: mono, borderRadius: "6px" }}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.03, ease }}
      whileHover={{
        backgroundColor: "rgba(139, 124, 246, 0.03)",
        x: 2,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      }}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span
            className="text-muted-foreground/20 group-hover:text-accent/40 transition-colors duration-200 shrink-0"
            style={{ fontSize: "0.6875rem" }}
          >
            ›
          </span>
          <h3
            className="text-foreground/85 group-hover:text-foreground transition-colors duration-200"
            style={{ fontSize: "0.9375rem", fontWeight: 500 }}
          >
            {project.name}
          </h3>
          {project.featured && <Tag variant="highlight">featured</Tag>}
          {project.status && (
            <span className="text-muted-foreground/35" style={{ fontSize: "0.6875rem" }}>
              {project.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/30" style={{ fontSize: "0.6875rem" }}>
            {project.platforms.join(" / ")}
          </span>
          {project.year && (
            <span className="text-accent/50" style={{ fontSize: "0.6875rem" }}>
              {project.year}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 text-foreground/50 group-hover:text-foreground/60 transition-colors duration-200 pl-6" style={{ fontSize: "0.8125rem", lineHeight: 1.75 }}>
        {project.description}
      </p>

      {/* Long description */}
      {project.longDescription && (
        <p className="mt-2 text-foreground/35 pl-6" style={{ fontSize: "0.75rem", lineHeight: 1.7 }}>
          {project.longDescription}
        </p>
      )}

      {/* Tags + links */}
      <div className="mt-3 pl-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <motion.span
              key={tag}
              className="px-2 py-0.5 text-muted-foreground/40 bg-muted-foreground/5 cursor-default"
              style={{ fontSize: "0.625rem", borderRadius: "4px" }}
              whileHover={{
                scale: 1.08,
                color: "var(--accent)",
                backgroundColor: "rgba(139, 124, 246, 0.08)",
                transition: { type: "spring", stiffness: 400, damping: 15 },
              }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
        <span className="flex-1" />
        <div className="flex items-center gap-3">
          {project.links.map((link) => (
            <motion.a
              key={link.type}
              href={link.href}
              className="inline-flex items-center gap-1 text-muted-foreground/40 hover:text-accent transition-colors duration-200"
              style={{ fontSize: "0.6875rem" }}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -1, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {link.type === "GitHub" ? <Github size={11} /> : <ExternalLink size={10} />}
              {link.type}
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function ProjectsPage() {
  return (
    <div className="space-y-8">
      {/* Boot */}
      <BootBlock
        lines={[
          {
            status: "OK",
            text: (
              <>
                Loaded <Accent>po4yka.dev/projects</Accent>
              </>
            ),
          },
          { status: "OK", text: `Mounted projects index — ${projects.length} entries found` },
          { status: "INFO", text: "Click any entry to expand details & links" },
        ]}
      />

      {/* List command */}
      <Cmd>
        ls -lt <Accent>./projects/</Accent>
      </Cmd>

      {/* Project entries in macOS window */}
      <MacWindow title={`projects — ${projects.length} entries`} dimLights delay={0.05}>
        {projects.map((project, i) => (
          <ProjectEntry key={project.slug} project={project} index={i} />
        ))}
      </MacWindow>

      {/* Decorative elements */}
      <UptimeStrip delay={0.1} />
      <ProcessTable delay={0.15} />
    </div>
  );
}
