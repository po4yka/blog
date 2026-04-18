import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { projects } from "@/data/projectsData";
import { Cmd, Accent, Tag, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { SectionHeader } from "./SectionHeader";
import { useLocale } from "@/stores/settingsStore";
import { ease } from "@/lib/motion";

export function Projects() {
  const { ref, inView } = useInView(0.05);
  const { t } = useLocale();
  const homeProjects = projects.slice(0, 4);

  return (
    <MotionProvider>
    <section id="projects" aria-labelledby="projects-heading" className="space-y-5">
      <SectionHeader
        number="04"
        label="PROJECTS"
        heading={t("projects.heading")}
        meta={`${projects.length} RECORDS`}
        id="projects-heading"
      />
      <Cmd>
        ./gradlew <Accent>:projects:list</Accent> --format=compact | head -4
      </Cmd>

      <MacWindow title="projects" sectionNumber="04" delay={0.05}>
        <div ref={ref} className="space-y-0">
          {homeProjects.map((project, i) => {
            const isLast = i === homeProjects.length - 1;
            const branch = isLast ? "└──" : "├──";
            const cont = isLast ? "   " : "│  ";
            return (
            <motion.a
              key={project.slug}
              href="/projects"
              className="group flex items-start gap-2 py-2.5 border-b border-border/50 last:border-b-0 -mx-2 px-2 font-mono"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.35, delay: 0.04 + i * 0.05, ease }}
            >
              {/* Tree branch prefix */}
              <span
                className="shrink-0 text-muted-foreground-dim transition-colors duration-200 text-mono-sm pt-0.5 select-none"
                aria-hidden="true"
              >
                {branch}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* First line: platform · name · year */}
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-muted-foreground text-mono-sm shrink-0 letter-wide" aria-hidden="true">
                    [{project.platforms[0]?.toLowerCase() ?? ""}]
                  </span>
                  <span className="text-foreground/80 group-hover:text-foreground transition-colors duration-200 truncate text-sm">
                    {project.name}
                  </span>
                  <span className="text-muted-foreground-dim text-mono-sm" aria-hidden="true">·</span>
                  <span className="text-muted-foreground text-mono-sm shrink-0">{project.year}</span>
                  {project.featured && (
                    <>
                      <span className="text-muted-foreground-dim text-mono-sm" aria-hidden="true">·</span>
                      <Tag variant="highlight">{t("projects.featured")}</Tag>
                    </>
                  )}
                </div>
                {/* Second line: continuation + description */}
                <div className="flex items-start gap-1.5 mt-0.5">
                  <span
                    className="shrink-0 text-muted-foreground-dim text-mono-sm select-none"
                    aria-hidden="true"
                  >
                    {cont} └─
                  </span>
                  <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-200 truncate text-mono-sm">
                    {project.description}
                  </p>
                </div>
              </div>
            </motion.a>
            );
          })}
        </div>
      </MacWindow>

      {/* View all link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <a
          href="/projects"
          aria-label={t("projects.viewAllLabel")}
          className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-200 inline-block font-mono text-mono-sm"
        >
          {t("projects.viewAll")}
        </a>
      </motion.div>
    </section>
    </MotionProvider>
  );
}
