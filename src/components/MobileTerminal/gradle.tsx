import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { useState } from "react";
import { Cmd, Accent, OutputBlock } from "@/components/Terminal";
import { MotionProvider } from "@/components/MotionProvider";
import { Shell } from "./Shell";

// --- ./gradlew assembleRelease ---

export function GradleBuild({ delay = 0 }: { delay?: number }) {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const tasks = [
    { name: ":app:compileKotlin", status: "ok", time: "12.4s" },
    { name: ":core:compileKotlin", status: "ok", time: "4.1s" },
    { name: ":shared:compileKotlinAndroid", status: "ok", time: "8.7s" },
    { name: ":shared:compileKotlinIosArm64", status: "ok", time: "6.2s" },
    { name: ":app:mergeReleaseResources", status: "ok", time: "1.3s" },
    { name: ":app:packageRelease", status: "ok", time: "3.8s" },
    { name: ":app:assembleRelease", status: "ok", time: "0.2s" },
  ];

  return (
    <Shell
      delay={delay}
      command={<>./gradlew <Accent>assembleRelease</Accent> --parallel</>}
      windowTitle="gradle — build"
    >
      {({ inView }) => (
        <>
          <motion.div
            className="text-muted-foreground/30 pb-2 text-mono-sm"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.08 }}
          >
            &gt; Configure project :app
          </motion.div>

          {tasks.map((task, i) => (
            <motion.div
              key={task.name}
              className="flex items-baseline gap-3 py-[3px] -mx-2 px-2 text-mono rounded-[4px]"
              style={{
                lineHeight: 1.7,
                backgroundColor: hoveredTask === task.name ? "rgba(139, 124, 246, 0.04)" : "transparent",
                transition: "background-color 0.15s ease",
              }}
              initial={{ opacity: 0, x: -4 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.12 + i * 0.04 }}
              onMouseEnter={() => setHoveredTask(task.name)}
              onMouseLeave={() => setHoveredTask(null)}
            >
              <motion.span
                className="font-medium"
                style={{ color: "var(--ok)", opacity: 0.8 }}
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                {"\u2713"}
              </motion.span>
              <span className="text-foreground/55 flex-1">{task.name}</span>
              <span className="text-muted-foreground/30 shrink-0">{task.time}</span>
            </motion.div>
          ))}

          <motion.div
            className="pt-3 mt-3 space-y-1 text-mono"
            style={{ borderTop: "1px solid var(--border)" }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.45 }}
          >
            <div className="text-foreground/50">
              <span style={{ color: "var(--ok)", opacity: 0.8 }}>BUILD SUCCESSFUL</span>
              <span className="text-muted-foreground/30"> in 36s</span>
            </div>
            <div className="text-muted-foreground/30 text-mono-sm">
              47 actionable tasks: 47 executed · 0 up-to-date
            </div>
          </motion.div>
        </>
      )}
    </Shell>
  );
}

// --- ktlint / detekt check ---
// Uses OutputBlock instead of MacWindow, so Shell does not apply here.

export function KtlintCheck({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);

  return (
    <MotionProvider>
      <section className="space-y-4">
        <Cmd delay={delay}>
          ./gradlew <Accent>detektAll</Accent> ktlintCheck
        </Cmd>

        <OutputBlock delay={delay + 0.05}>
          <div
            ref={ref}
            className="space-y-1 text-mono"
            style={{ lineHeight: 1.7 }}
          >
            <motion.div
              className="text-muted-foreground/35"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.08 }}
            >
              &gt; Task :app:detekt
            </motion.div>
            <motion.div
              className="text-foreground/50"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.12 }}
            >
              <span style={{ color: "var(--ok)", opacity: 0.7 }}>{"\u2713"}</span>{" "}
              detekt — 0 issues found in 247 files
            </motion.div>
            <motion.div
              className="text-muted-foreground/35"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.16 }}
            >
              &gt; Task :app:ktlintCheck
            </motion.div>
            <motion.div
              className="text-foreground/50"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.2 }}
            >
              <span style={{ color: "var(--ok)", opacity: 0.7 }}>{"\u2713"}</span>{" "}
              ktlint — all files formatted correctly
            </motion.div>
            <motion.div
              className="text-muted-foreground/25 pt-1 text-mono-sm"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.28 }}
            >
              BUILD SUCCESSFUL in 8s · 4 actionable tasks executed
            </motion.div>
          </div>
        </OutputBlock>
      </section>
    </MotionProvider>
  );
}
