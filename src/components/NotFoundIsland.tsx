import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { MotionProvider } from "./MotionProvider";
import { SectionHeader } from "./SectionHeader";
import { useLocale, useSettings } from "@/stores/settingsStore";
import { ease } from "@/lib/motion";

export function NotFound() {
  const { t } = useLocale();
  const { reduceMotion } = useSettings();
  const [glitchTransform, setGlitchTransform] = useState("none");

  // Glitch effect on the 404 number (respects reduce-motion)
  useEffect(() => {
    if (reduceMotion) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Entry flicker: rapid glitch sequence for the first 800ms
    const entryInterval = setInterval(() => {
      const x = Math.random() * 8 - 4;
      const y = Math.random() * 4 - 2;
      const skew = Math.random() * 4 - 2;
      setGlitchTransform(
        `translate(${x}px, ${y}px) skewX(${skew}deg)`
      );
      const t = setTimeout(() => setGlitchTransform("none"), 80);
      timeouts.push(t);
    }, 100);

    const entryEnd = setTimeout(() => {
      clearInterval(entryInterval);
      setGlitchTransform("none");

      // Periodic subtle glitch after entry sequence
      const periodicId = setInterval(() => {
        const x = Math.random() * 6 - 3;
        const y = Math.random() * 3 - 1.5;
        setGlitchTransform(`translate(${x}px, ${y}px)`);
        const t = setTimeout(() => setGlitchTransform("none"), 200);
        timeouts.push(t);
      }, 4000);

      timeouts.push(periodicId as unknown as ReturnType<typeof setTimeout>);
    }, 800);

    return () => {
      clearInterval(entryInterval);
      clearTimeout(entryEnd);
      timeouts.forEach((id) => {
        clearTimeout(id);
        clearInterval(id as unknown as ReturnType<typeof setInterval>);
      });
    };
  }, [reduceMotion]);

  return (
    <MotionProvider>
    <div className="pt-16 font-mono">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease }}
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "2px",
        }}
      >
        {/* Operator-console header row */}
        <div
          className="px-4 py-[10px]"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <SectionHeader
            number="!!"
            label="NOT FOUND"
            heading={t("notFound.windowTitle")}
            className="pb-0"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <motion.div
            className="text-mono"
            style={{ lineHeight: 1.7 }}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <span className="text-destructive">[ ERROR ]</span>{" "}
            <span className="text-foreground/80">
              {t("notFound.error")}
            </span>
          </motion.div>
          <motion.div
            className="text-mono"
            style={{ lineHeight: 1.7 }}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <span className="text-muted-foreground label-meta">INFO ·</span>{" "}
            <span className="text-foreground/70">
              {t("notFound.info")}
            </span>
          </motion.div>

          <motion.div
            style={{ fontSize: "2.5rem" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease }}
          >
            <span
              className="text-foreground/80"
              style={{
                display: "inline-block",
                transform: glitchTransform,
                transition: glitchTransform !== "none" ? "none" : "all 0.1s ease",
              }}
            >
              404
            </span>
            <span className="text-muted-foreground mx-3" style={{ fontSize: "1.5rem" }}>—</span>
            <span className="text-foreground/60" style={{ fontSize: "1rem" }}>{t("notFound.pageNotFound")}</span>
          </motion.div>

          <motion.a
            href="/"
            aria-label={t("notFound.goHome")}
            title={t("notFound.goHome")}
            className="text-foreground/80 hover:text-foreground hover:underline transition-colors cursor-pointer inline-flex items-center gap-2 text-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {t("notFound.goBack")}
          </motion.a>
        </div>
      </motion.div>
    </div>
    </MotionProvider>
  );
}
