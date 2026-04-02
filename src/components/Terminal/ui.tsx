import { motion } from "motion/react";
import { spring } from "@/lib/motion";
import type { ReactNode } from "react";

/**
 * Accent-colored text helper
 */
export function Accent({ children }: { children: ReactNode }) {
  return <span style={{ color: "var(--accent)" }}>{children}</span>;
}

/**
 * Tag badge with hover scale
 */
export function Tag({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "highlight";
}) {
  return (
    <motion.span
      className={`inline-block px-2 py-0.5 cursor-default font-mono text-xs uppercase rounded-[4px] ${
        variant === "highlight"
          ? "text-accent bg-accent/10"
          : "text-muted-foreground/60 bg-muted-foreground/5"
      }`}
      style={{
        letterSpacing: "0.06em",
      }}
      whileHover={{
        scale: 1.08,
        y: -1,
        transition: spring.snappy,
      }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.span>
  );
}
