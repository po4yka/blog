import { motion } from "motion/react";
import { useInView } from "./useInView";
import { roles } from "./experienceData";
import { Cmd, Accent, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";

const mono = "'JetBrains Mono', monospace";
const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function Experience() {
  const { ref, inView } = useInView(0.05);

  return (
    <MotionProvider>
    <section id="experience" className="space-y-5">
      <Cmd>
        git log <Accent>--author=po4yka</Accent> --format=career | head -3
      </Cmd>

      <MacWindow title="resume.log" dimLights delay={0.05}>
        <div ref={ref} className="space-y-0">
          {roles.slice(0, 3).map((role, i) => (
            <motion.div
              key={role.period}
              className="py-4 border-b border-border/50 last:border-b-0 -mx-2 px-2 group"
              style={{ fontFamily: mono, borderRadius: "6px" }}
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: 0.04 + i * 0.05, ease }}
              whileHover={{
                backgroundColor: "rgba(139, 124, 246, 0.03)",
                x: 2,
                transition: { type: "spring", stiffness: 300, damping: 25 },
              }}
            >
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-foreground/80 group-hover:text-foreground transition-colors duration-200"
                    style={{ fontSize: "0.875rem", fontWeight: 500 }}
                  >
                    {role.title}
                  </span>
                  <span
                    className="text-muted-foreground/40"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {role.company}
                  </span>
                </div>
                <span
                  className="text-accent/50"
                  style={{ fontSize: "0.75rem" }}
                >
                  {role.period}
                </span>
              </div>
              <p
                className="mt-1.5 text-foreground/50 group-hover:text-foreground/60 transition-colors duration-200"
                style={{ fontSize: "0.8125rem", lineHeight: 1.7 }}
              >
                {role.description}
              </p>
              {role.tags && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {role.tags.map((tag) => (
                    <motion.span
                      key={tag}
                      className="text-muted-foreground/35 bg-muted-foreground/5 px-1.5 py-0.5 cursor-default"
                      style={{ fontSize: "0.6875rem", borderRadius: "4px" }}
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
          className="text-muted-foreground/40 hover:text-accent transition-colors duration-200 inline-block"
          style={{ fontFamily: mono, fontSize: "0.75rem" }}
          whileHover={{ x: 4 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          $ git log --author=po4yka — full history →
        </motion.a>
      </motion.div>
    </section>
    </MotionProvider>
  );
}
