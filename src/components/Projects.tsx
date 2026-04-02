import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { projects } from "@/data/projectsData";
import { Cmd, Accent, Tag, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function Projects() {
  const { ref, inView } = useInView(0.05);
  const homeProjects = projects.slice(0, 4);

  return (
    <MotionProvider>
    <section id="projects" className="space-y-5">
      <Cmd>
        ./gradlew <Accent>:projects:list</Accent> --format=compact | head -4
      </Cmd>

      <MacWindow title="projects" dimLights delay={0.05}>
        <div ref={ref} className="space-y-0">
          {homeProjects.map((project, i) => (
            <motion.a
              key={project.slug}
              href="/projects"
              className="group flex items-start gap-3 py-3 border-b border-border/50 last:border-b-0 -mx-2 px-2 font-mono rounded-[6px]"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: 0.04 + i * 0.05, ease }}
              whileHover={{
                x: 4,
                backgroundColor: "rgba(139, 124, 246, 0.04)",
                transition: { type: "spring", stiffness: 300, damping: 25 },
              }}
              whileTap={{ scale: 0.995 }}
            >
              {/* Arrow marker — slides in on hover */}
              <motion.span
                className="text-muted-foreground/20 group-hover:text-accent/60 transition-colors duration-200 shrink-0 pt-0.5 text-mono-sm"
                initial={false}
                animate={{ x: 0 }}
                whileHover={{ x: 2 }}
              >
                ›
              </motion.span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <span
                    className="text-foreground/80 group-hover:text-foreground transition-colors duration-200 truncate text-sm"
                  >
                    {project.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {project.featured && <Tag variant="highlight">featured</Tag>}
                    <span
                      className="text-muted-foreground/35 text-mono-sm"
                    >
                      {project.platforms.join(" / ")}
                    </span>
                    <span
                      className="text-accent/50 text-mono-sm"
                    >
                      {project.year}
                    </span>
                  </div>
                </div>
                <p
                  className="mt-0.5 text-muted-foreground/50 group-hover:text-muted-foreground/65 transition-colors duration-200 truncate text-mono-sm"
                >
                  {project.description}
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </MacWindow>

      {/* View all link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <motion.a
          href="/projects"
          className="text-muted-foreground/40 hover:text-accent transition-colors duration-200 inline-block font-mono text-mono-sm"
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97, x: 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          $ ls ./projects/ — view all →
        </motion.a>
      </motion.div>
    </section>
    </MotionProvider>
  );
}
