import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { roles } from "@/data/experienceData";
import { Cmd, Accent, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { SectionHeader } from "./SectionHeader";
import { useLocale } from "@/stores/settingsStore";
import { ease } from "@/lib/motion";

export function Experience() {
  const { ref, inView } = useInView(0.05);
  const { t } = useLocale();

  return (
    <MotionProvider>
    <section id="experience" aria-labelledby="experience-heading" className="space-y-5">
      <SectionHeader
        number="05"
        label="EXPERIENCE"
        heading={t("experience.heading")}
        id="experience-heading"
      />
      <Cmd>
        git log <Accent>--author=po4yka</Accent> --format=career | head -3
      </Cmd>

      <MacWindow title="resume.log" sectionNumber="05" delay={0.05}>
        <div ref={ref} className="space-y-0">
          {roles.slice(0, 3).map((role, i) => (
            <motion.div
              key={role.period}
              className="py-4 border-b border-border/50 last:border-b-0 -mx-2 px-2 group font-mono"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: 0.04 + i * 0.05, ease }}
            >
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-2">
                  {/* Status marker: ● current, ○ past */}
                  <span
                    className="shrink-0 text-mono-sm select-none"
                    style={{ color: "var(--foreground)", opacity: i === 0 ? 0.80 : 0.30 }}
                    aria-hidden="true"
                    title={i === 0 ? "current" : "past"}
                  >
                    {i === 0 ? "●" : "○"}
                  </span>
                  {/* Column divider */}
                  <span
                    className="shrink-0 text-muted-foreground-dim text-mono-sm select-none"
                    aria-hidden="true"
                  >
                    │
                  </span>
                  <span
                    className="text-foreground/80 group-hover:text-foreground transition-colors duration-200 text-sm font-medium"
                  >
                    {role.title}
                  </span>
                  <span
                    className="text-muted-foreground text-mono-sm"
                  >
                    {role.company}
                  </span>
                </div>
                <span
                  className="text-muted-foreground text-mono-sm tabular-nums"
                >
                  {role.period}
                </span>
              </div>
              <p
                className="mt-1.5 text-muted-foreground group-hover:text-foreground/70 transition-colors duration-200 text-mono"
                style={{ lineHeight: 1.7 }}
              >
                {role.description}
              </p>
              {role.tags && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {role.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-muted-foreground bg-muted px-1.5 py-0.5 cursor-default text-label rounded-[2px]"
                    >
                      {tag}
                    </span>
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
        <a
          href="/experience"
          className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-200 inline-block font-mono text-mono-sm"
        >
          {t("experience.viewAll")}
        </a>
      </motion.div>
    </section>
    </MotionProvider>
  );
}
