import { lazy, Suspense } from "react";
import { TerminalPrompt } from "./Terminal";
import { motion } from "motion/react";

const UptimeStrip = lazy(() => import("./Decorations").then(m => ({ default: m.UptimeStrip })));
import { MotionProvider } from "./MotionProvider";

export function Footer() {
  return (
    <MotionProvider>
    <footer aria-label="Site footer" className="max-w-[1080px] mx-auto px-6 md:px-10 lg:px-12 pb-12">
      <div className="space-y-6">
        <Suspense fallback={null}>
          <UptimeStrip delay={0} />
        </Suspense>

        {/* Interactive terminal */}
        <div
          className="p-4"
          style={{
            borderRadius: "8px",
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-3xs font-mono text-muted-foreground/20 pb-2">
            interactive shell -- try: help, ls posts/, cat meridian, open blog, neofetch
          </div>
          <TerminalPrompt />
        </div>

        <div
          className="pt-5"
          style={{ borderTop: "1px solid var(--titlebar-border)" }}
        >
          <motion.p
            className="text-center font-mono text-label text-muted-foreground/20"
            whileHover={{ color: "var(--muted-foreground)", opacity: 0.4 }}
            transition={{ duration: 0.3 }}
          >
            © {new Date().getFullYear()} Nikita Pochaev · built with ghostty vibes
          </motion.p>
        </div>
      </div>
    </footer>
    </MotionProvider>
  );
}
