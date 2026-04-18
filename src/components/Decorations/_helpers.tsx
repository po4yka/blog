import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { ease } from "@/lib/motion";

/** Shared panel shell — flat, hairline, operator-console header row. */
export function PanelShell({
  label,
  labelRight,
  children,
  delay = 0,
}: {
  label: string;
  labelRight?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.08);

  return (
    <motion.div
      ref={ref}
      className="overflow-hidden font-mono"
      style={{
        border: "1px solid var(--border)",
        borderRadius: 2,
        background: "var(--panel-bg)",
      }}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.45, delay, ease }}
    >
      <div
        className="flex items-baseline justify-between px-4 py-2"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <span className="label-meta">{label}</span>
        {labelRight && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--muted-foreground-dim)",
              letterSpacing: "0.06em",
            }}
          >
            {labelRight}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}
