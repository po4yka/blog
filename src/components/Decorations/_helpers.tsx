import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { ease, easeStep8 } from "@/lib/motion";
import { barColor } from "./_utils";

/** Shared panel shell — flat, hairline, operator-console header row. */
export function PanelShell({
  label,
  labelRight,
  children,
  delay = 0,
}: {
  label: string;
  labelRight?: string;
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

export function UsageBar({
  pct,
  blocks = 22,
  delay = 0,
  inView = true,
}: {
  pct: number;
  blocks?: number;
  delay?: number;
  inView?: boolean;
}) {
  const allBlocks = "\u2588".repeat(blocks);
  const color = barColor();

  return (
    <motion.span
      className="inline-flex items-center cursor-default relative"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4, delay }}
      title={`${pct}%`}
    >
      <span className="text-mono-sm" style={{ color: "var(--bar-empty)", letterSpacing: "-0.5px" }}>
        {allBlocks}
      </span>
      <motion.span
        className="absolute left-0 top-0 overflow-hidden"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: easeStep8 }}
      >
        <span className="text-mono-sm whitespace-nowrap" style={{ color, letterSpacing: "-0.5px" }}>
          {allBlocks}
        </span>
      </motion.span>
    </motion.span>
  );
}
