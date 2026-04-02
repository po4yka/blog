import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { Cmd, OutputBlock, Accent } from "./Terminal";
import { MotionProvider } from "./MotionProvider";

export function About() {
  const { ref, inView } = useInView(0.1);

  return (
    <MotionProvider>
    <section id="about" className="space-y-5">
      <Cmd>
        cat <Accent>README.md</Accent> | head -20
      </Cmd>

      <OutputBlock delay={0.05}>
        <div
          ref={ref}
          className="space-y-5 font-mono text-sm text-foreground/70"
          style={{ lineHeight: 1.8 }}
        >
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            I'm a mobile engineer who cares equally about the code inside the app and
            the systems around it — build pipelines, release automation, developer tooling,
            and the invisible infrastructure that lets a team ship with confidence.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.12 }}
          >
            Most of my work is in Kotlin and Swift, with growing investment in{" "}
            <motion.span
              style={{ color: "var(--accent)", cursor: "default" }}
              whileHover={{ textShadow: "0 0 12px rgba(139, 124, 246, 0.4)" }}
            >
              Kotlin Multiplatform
            </motion.span>{" "}
            for sharing logic across platforms
            without sacrificing native feel. I like apps that are fast, reliable, and
            well-structured. I like teams that deploy often and debug rarely.
          </motion.p>
          <motion.p
            className="text-foreground/45"
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.19 }}
          >
            Outside of code, I spend time reading about distributed systems, tinkering
            with build tooling, and occasionally writing about the things I learn along
            the way.
          </motion.p>
        </div>
      </OutputBlock>
    </section>
    </MotionProvider>
  );
}
