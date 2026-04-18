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
import { SectionHeader } from "./SectionHeader";
import { ErrorBoundary } from "./ErrorBoundary";
import { useInView } from "@/hooks/useInView";

const ProcessTable = lazy(() => import("./Decorations").then(m => ({ default: m.ProcessTable })));
import { projects, type Project } from "@/data/projectsData";
import { MotionProvider } from "./MotionProvider";
import { ease } from "@/lib/motion";
import { useLocale } from "@/stores/settingsStore";

function ProjectEntry({ project }: { project: Project }) {
  const { ref, inView } = useInView(0.08);
  const { t } = useLocale();

  return (
    <motion.div
      ref={ref}
      className="py-5 border-b border-border last:border-b-0 group"
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.03, ease }}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span
            className="text-muted-foreground-dim shrink-0 text-label"
            aria-hidden="true"
          >
            ├──
          </span>
          <h3
            className="text-foreground/85 group-hover:text-foreground transition-colors duration-150 text-mono-lg font-medium"
          >
            {project.name}
          </h3>
          {project.featured && <Tag variant="highlight">{t("projects.featured")}</Tag>}
          {project.status && (
            <span className="text-muted-foreground text-label">
              {project.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-label">
            {project.platforms.join(" / ")}
          </span>
          {project.year && (
            <span className="text-muted-foreground text-label">
              {project.year}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 text-foreground/60 group-hover:text-foreground/75 transition-colors duration-150 pl-6 font-mono text-mono" style={{ lineHeight: 1.75 }}>
        {project.description}
      </p>

      {/* Long description */}
      {project.longDescription && (
        <p className="mt-2 text-foreground/75 pl-6 font-mono text-mono-sm" style={{ lineHeight: 1.7 }}>
          {project.longDescription}
        </p>
      )}

      {/* Tags + links */}
      <div className="mt-3 pl-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-muted-foreground bg-muted cursor-default text-xs"
              style={{ borderRadius: "2px" }}
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="flex-1" />
        <div className="flex items-center gap-3">
          {project.links.map((link) => (
            <a
              key={link.type}
              href={link.href}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 text-label"
              target="_blank"
              rel="noopener noreferrer"
              data-umami-event="click-project-link"
              data-umami-event-target={`${project.name}:${link.type}`}
            >
              {link.type === "GitHub" ? <GithubIcon size={11} /> : <ExternalLink size={10} />}
              {link.type}
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function ProjectsPage() {
  const { t } = useLocale();
  return (
    <ErrorBoundary>
    <MotionProvider>
    <div className="space-y-8">
      <SectionHeader
        number="04"
        label="PROJECTS"
        heading="Projects"
        meta={`${projects.length} ${t("projectsPage.entries") ?? "ENTRIES"}`}
      />

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
          { status: "OK", text: `Mounted projects index — ${projects.length} ${t("projectsPage.entriesFound")}` },
          { status: "INFO", text: t("projectsPage.clickToExpand") },
        ]}
      />

      {/* List command */}
      <Cmd>
        ls -lt <Accent>./projects/</Accent>
      </Cmd>

      {/* Project entries */}
      <MacWindow
        label={`projects — ${projects.length} ${t("projectsPage.entries")}`}
        sectionNumber="04"
        delay={0.05}
      >
        {projects.map((project) => (
          <ProjectEntry key={project.slug} project={project} />
        ))}
      </MacWindow>

      {/* Decorative elements */}
      <Suspense fallback={null}>
        <ProcessTable delay={0.15} />
      </Suspense>
    </div>
    </MotionProvider>
    </ErrorBoundary>
  );
}
