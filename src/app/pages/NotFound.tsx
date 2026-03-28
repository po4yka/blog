import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

const mono = "'JetBrains Mono', monospace";
const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function NotFound() {
  const navigate = useNavigate();
  const [glitch, setGlitch] = useState(false);

  // Periodic glitch effect on the 404 number
  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pt-16" style={{ fontFamily: mono }}>
      <motion.div
        className="overflow-hidden"
        style={{
          borderRadius: "10px",
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
              onClick={() => navigate("/")}
              title="Go home"
            />
            <span className="w-[11px] h-[11px] rounded-full" style={{ backgroundColor: "var(--dot-dim)" }} />
            <span className="w-[11px] h-[11px] rounded-full" style={{ backgroundColor: "var(--dot-dim)" }} />
          </div>
          <span className="flex-1 text-center text-muted-foreground/40 select-none" style={{ fontSize: "0.6875rem" }}>
            error — 404
          </span>
          <span style={{ width: 54 }} />
        </div>
        {/* Content */}
        <div className="p-6 space-y-6">
          <motion.div
            style={{ fontSize: "0.8125rem", lineHeight: 1.7 }}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <span className="text-destructive">[ ERROR ]</span>{" "}
            <span className="text-foreground/70">
              Route not found — no matching endpoint for this path
            </span>
          </motion.div>
          <motion.div
            style={{ fontSize: "0.8125rem", lineHeight: 1.7 }}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <span style={{ color: "var(--info)" }}>[ INFO ]</span>{" "}
            <span className="text-foreground/50">
              Try navigating to a known route or return home
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
                transform: glitch ? `translate(${Math.random() * 4 - 2}px, ${Math.random() * 2 - 1}px)` : "none",
                textShadow: glitch ? "2px 0 var(--accent), -2px 0 var(--destructive)" : "none",
                transition: glitch ? "none" : "all 0.1s ease",
              }}
            >
              404
            </span>
            <span className="text-muted-foreground/30 mx-3" style={{ fontSize: "1.5rem" }}>—</span>
            <span className="text-foreground/50" style={{ fontSize: "1rem" }}>Page not found</span>
          </motion.div>

          <motion.button
            onClick={() => navigate("/")}
            className="text-accent hover:text-accent/80 transition-colors cursor-pointer inline-flex items-center gap-2"
            style={{ fontSize: "0.8125rem" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.97 }}
          >
            ← cd ~
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}