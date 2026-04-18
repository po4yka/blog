import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { Cmd, OutputBlock, Accent } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { useLocale } from "@/stores/settingsStore";

export function About() {
  const { ref, inView } = useInView(0.1);
  const { t } = useLocale();

  return (
    <MotionProvider>
    <section id="about" aria-labelledby="about-heading" className="space-y-5">
      <h2 id="about-heading" className="sr-only">{t("about.heading")}</h2>
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
            {t("about.p1")}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.12 }}
          >
            {t("about.p2prefix")}{" "}
            <motion.span
              style={{ color: "var(--accent)", cursor: "default" }}
              whileHover={{ textShadow: "var(--phosphor-glow)" }}
            >
              {t("about.p2kmp")}
            </motion.span>{" "}
            {t("about.p2suffix")}
          </motion.p>
          <motion.p
            className="text-foreground/75"
            initial={{ opacity: 0, y: 6 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.19 }}
          >
            {t("about.p3")}
          </motion.p>
        </div>
      </OutputBlock>
    </section>
    </MotionProvider>
  );
}
