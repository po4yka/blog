import { motion } from "motion/react";
import { useInView } from "@/components/useInView";
import { ease } from "@/lib/motion";
import { barColor } from "./_utils";

/** Shared panel shell with hover lift */
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
      className="overflow-hidden rounded-[10px] font-mono"
      style={{
        border: "1px solid var(--border)",
        background: "var(--panel-bg)",
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease }}
      whileHover={{
        y: -1,
        transition: { duration: 0.2 },
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-2.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="text-muted-foreground/50 uppercase text-mono-sm font-medium"
          style={{ letterSpacing: "0.12em" }}
        >
          {label}
        </span>
        {labelRight && (
          <span className="text-muted-foreground/30 text-label">
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
  const color = barColor(pct);

  return (
    <motion.span
      className="inline-flex items-center cursor-default relative"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4, delay }}
      title={`${pct}%`}
    >
      {/* Empty (background) layer */}
      <span className="text-mono-sm" style={{ color: "var(--bar-empty)", letterSpacing: "-0.5px" }}>
        {allBlocks}
      </span>
      {/* Filled layer with smooth width transition */}
      <motion.span
        className="absolute left-0 top-0 overflow-hidden"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <span className="text-mono-sm whitespace-nowrap" style={{ color, letterSpacing: "-0.5px" }}>
          {allBlocks}
        </span>
      </motion.span>
    </motion.span>
  );
}
