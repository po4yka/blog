import { motion } from "motion/react";
import { useMemo } from "react";
import { useInView } from "@/hooks/useInView";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell, UsageBar } from "./_helpers";
import { projects } from "@/data/projectsData";
import { aggregateProjectTags } from "@/lib/homeStats";

export function TechTagHeatmap({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const tags = useMemo(() => aggregateProjectTags(projects, 10), []);

  return (
    <MotionProvider>
      <PanelShell label="tags" labelRight="top 10" delay={delay}>
        <div ref={ref} className="px-5 py-3.5 space-y-1.5">
          {tags.map((tag, i) => (
            <motion.div
              key={tag.label}
              className="flex items-center gap-3 -mx-1 px-1 py-[1px] hover:bg-accent/[0.04] transition-colors duration-150 text-label rounded-[3px]"
              initial={{ opacity: 0, x: -4 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.08 + i * 0.04 }}
            >
              <span
                className="text-muted-foreground/40 shrink-0"
                style={{ minWidth: "110px" }}
              >
                {tag.label}
              </span>
              <UsageBar pct={tag.pct} delay={delay + 0.1 + i * 0.04} inView={inView} />
              <span className="text-muted-foreground/30 w-[20px] text-right shrink-0">
                {tag.count}
              </span>
            </motion.div>
          ))}
        </div>
        <div
          className="flex items-center px-5 py-2 text-muted-foreground/25 text-xs"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span>across {projects.length} projects</span>
        </div>
      </PanelShell>
    </MotionProvider>
  );
}
