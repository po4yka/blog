import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { MotionProvider } from "./MotionProvider";
import { useLocale } from "@/stores/settingsStore";
import { ease } from "@/lib/motion";

export function NotFound() {
  const { t } = useLocale();
  const [glitchTransform, setGlitchTransform] = useState("none");

  // Periodic glitch effect on the 404 number
  useEffect(() => {
    const id = setInterval(() => {
      const x = Math.random() * 4 - 2;
      const y = Math.random() * 2 - 1;
      setGlitchTransform(`translate(${x}px, ${y}px)`);
      setTimeout(() => setGlitchTransform("none"), 150);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <MotionProvider>
    <div className="pt-16 font-mono">
      <motion.div
        className="overflow-hidden rounded-[10px]"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--window-shadow-sm)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        whileHover={{
          boxShadow: "var(--window-shadow)",
          y: -1,
          transition: { duration: 0.25 },
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-3 px-4 py-[10px]"
          style={{
            background: "var(--titlebar)",
            borderBottom: "1px solid var(--titlebar-border)",
          }}
        >
          <div className="flex items-center gap-[6px]">
            <motion.span
              className="w-[11px] h-[11px] rounded-full cursor-pointer"
              style={{ backgroundColor: "var(--signal-red)", opacity: 0.85 }}
              whileHover={{ scale: 1.2, opacity: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { window.location.href = "/"; }}
              title={t("notFound.goHome")}
            />
            <span className="w-[11px] h-[11px] rounded-full" style={{ backgroundColor: "var(--dot-dim)" }} />
            <span className="w-[11px] h-[11px] rounded-full" style={{ backgroundColor: "var(--dot-dim)" }} />
          </div>
          <span className="flex-1 text-center text-muted-foreground/40 select-none text-label">
            {t("notFound.windowTitle")}
          </span>
          <span style={{ width: 54 }} />
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
            <span className="text-foreground/70">
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
            <span style={{ color: "var(--info)" }}>[ INFO ]</span>{" "}
            <span className="text-foreground/50">
              {t("notFound.info")}
            </span>
          </motion.div>

          <motion.div
            style={{ fontSize: "2.5rem" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease }}
          >
            <span
              className="text-foreground/80"
              style={{
                display: "inline-block",
                transform: glitchTransform,
                textShadow: glitchTransform !== "none" ? "2px 0 var(--accent), -2px 0 var(--destructive)" : "none",
                transition: glitchTransform !== "none" ? "none" : "all 0.1s ease",
              }}
            >
              404
            </span>
            <span className="text-muted-foreground/30 mx-3" style={{ fontSize: "1.5rem" }}>—</span>
            <span className="text-foreground/50" style={{ fontSize: "1rem" }}>{t("notFound.pageNotFound")}</span>
          </motion.div>

          <motion.button
            onClick={() => { window.location.href = "/"; }}
            className="text-accent hover:text-accent/80 transition-colors cursor-pointer inline-flex items-center gap-2 text-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.97 }}
          >
            {t("notFound.goBack")}
          </motion.button>
        </div>
      </motion.div>
    </div>
    </MotionProvider>
  );
}
