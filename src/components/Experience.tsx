import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { roles } from "@/data/experienceData";
import { Cmd, Accent, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function Experience() {
  const { ref, inView } = useInView(0.05);

  return (
    <MotionProvider>
    <section id="experience" aria-labelledby="experience-heading" className="space-y-5">
      <h2 id="experience-heading" className="sr-only">Experience</h2>
      <Cmd>
        git log <Accent>--author=po4yka</Accent> --format=career | head -3
      </Cmd>

      <MacWindow title="resume.log" dimLights delay={0.05}>
        <div ref={ref} className="space-y-0">
          {roles.slice(0, 3).map((role, i) => (
            <motion.div
              key={role.period}
              className="py-4 border-b border-border/50 last:border-b-0 -mx-2 px-2 group font-mono rounded-[6px]"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: 0.04 + i * 0.05, ease }}
              whileHover={{
                backgroundColor: "rgba(145, 132, 247, 0.03)",
                x: 2,
                transition: { type: "spring", stiffness: 300, damping: 25 },
              }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-foreground/80 group-hover:text-foreground transition-colors duration-200 text-sm font-medium"
                  >
                    {role.title}
                  </span>
                  <span
                    className="text-muted-foreground/50 text-mono-sm"
                  >
                    {role.company}
                  </span>
                </div>
                <span
                  className="text-accent/50 text-mono-sm"
                >
                  {role.period}
                </span>
              </div>
              <p
                className="mt-1.5 text-foreground/50 group-hover:text-foreground/60 transition-colors duration-200 text-mono"
                style={{ lineHeight: 1.7 }}
              >
                {role.description}
              </p>
              {role.tags && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {role.tags.map((tag) => (
                    <motion.span
                      key={tag}
                      className="text-muted-foreground/50 bg-muted-foreground/5 px-1.5 py-0.5 cursor-default text-label rounded-[4px]"
                      whileHover={{
                        scale: 1.08,
                        color: "var(--accent)",
                        backgroundColor: "rgba(145, 132, 247, 0.08)",
                        transition: { type: "spring", stiffness: 400, damping: 15 },
                      }}
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </MacWindow>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <motion.a
          href="/experience"
          className="text-muted-foreground/55 hover:text-accent transition-colors duration-200 inline-block font-mono text-mono-sm"
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97, x: 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          $ git log --author=po4yka — full history →
        </motion.a>
      </motion.div>
    </section>
    </MotionProvider>
  );
}
