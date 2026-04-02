import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
import { lazy, Suspense } from "react";
import { BootBlock, Cmd, Accent, Tag, MacWindow } from "./Terminal";
import { useInView } from "@/hooks/useInView";

const ProcessTable = lazy(() => import("./Decorations").then(m => ({ default: m.ProcessTable })));
const UptimeStrip = lazy(() => import("./Decorations").then(m => ({ default: m.UptimeStrip })));
import { projects, type Project } from "@/data/projectsData";
import { MotionProvider } from "./MotionProvider";
import { ease, spring } from "@/lib/motion";

function ProjectEntry({ project }: { project: Project }) {
  const { ref, inView } = useInView(0.08);

  return (
    <motion.div
      ref={ref}
      className="py-5 border-b border-border/40 last:border-b-0 -mx-2 px-2 group font-mono rounded-[6px]"
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
            className="text-muted-foreground/20 group-hover:text-accent/40 transition-colors duration-200 shrink-0 text-label"
          >
            ›
          </span>
          <h3
            className="text-foreground/85 group-hover:text-foreground transition-colors duration-200 text-mono-lg font-medium"
          >
            {project.name}
          </h3>
          {project.featured && <Tag variant="highlight">featured</Tag>}
          {project.status && (
            <span className="text-muted-foreground/35 text-label">
              {project.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/30 text-label">
            {project.platforms.join(" / ")}
          </span>
          {project.year && (
            <span className="text-accent/50 text-label">
              {project.year}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 text-foreground/50 group-hover:text-foreground/60 transition-colors duration-200 pl-6 text-mono" style={{ lineHeight: 1.75 }}>
        {project.description}
      </p>

      {/* Long description */}
      {project.longDescription && (
        <p className="mt-2 text-foreground/35 pl-6 text-mono-sm" style={{ lineHeight: 1.7 }}>
          {project.longDescription}
        </p>
      )}

      {/* Tags + links */}
      <div className="mt-3 pl-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <motion.span
              key={tag}
              className="px-2 py-0.5 text-muted-foreground/40 bg-muted-foreground/5 cursor-default text-xs rounded-[4px]"
              whileHover={{
                scale: 1.08,
                y: -1,
                color: "var(--accent)",
                backgroundColor: "rgba(139, 124, 246, 0.08)",
                transition: spring.snappy,
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
              className="inline-flex items-center gap-1 text-muted-foreground/40 hover:text-accent transition-colors duration-200 text-label"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -1, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {link.type === "GitHub" ? <GithubIcon size={11} /> : <ExternalLink size={10} />}
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
    <MotionProvider>
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
        {projects.map((project) => (
          <ProjectEntry key={project.slug} project={project} />
        ))}
      </MacWindow>

      {/* Decorative elements */}
      <Suspense fallback={null}>
        <UptimeStrip delay={0.1} />
        <ProcessTable delay={0.15} />
      </Suspense>
    </div>
    </MotionProvider>
  );
}
