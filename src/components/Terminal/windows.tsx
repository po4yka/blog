import { motion } from "motion/react";
import { useInView } from "@/components/useInView";
import { type ReactNode } from "react";
import { ease, duration, stagger } from "@/lib/motion";
import { TrafficLights } from "./TrafficLights";

/**
 * macOS window wrapper — hover elevation, traffic lights, title bar
 */
export function MacWindow({
  title,
  subtitle,
  children,
  delay = 0,
  className = "",
  dimLights = false,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  delay?: number;
  className?: string;
  dimLights?: boolean;
}) {
  const { ref, inView } = useInView(0.1);

  return (
    <motion.div
      ref={ref}
      className={`overflow-hidden rounded-[10px] ${className}`}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--window-shadow-sm)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: duration.slow, delay, ease }}
      whileHover={{
        boxShadow: "var(--window-shadow)",
        y: -1,
        transition: { duration: 0.25, ease: "easeOut" },
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
        <TrafficLights dim={dimLights} />
        {title && (
          <span
            className="flex-1 text-center text-muted-foreground/50 select-none font-mono text-label"
          >
            {title}
          </span>
        )}
        {!title && <span className="flex-1" />}
        {subtitle && (
          <span
            className="text-muted-foreground/25 select-none font-mono text-3xs"
          >
            {subtitle}
          </span>
        )}
      </div>
      {/* Content */}
      <div className="p-5 md:p-6 font-mono">
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Boot status block — [ OK ] / [ INFO ] messages with hover highlight
 */
export function BootBlock({
  lines,
  delay = 0,
}: {
  lines: { status: "OK" | "INFO" | "WARN"; text: ReactNode }[];
  delay?: number;
}) {
  const { ref, inView } = useInView(0.1);

  return (
    <motion.div
      ref={ref}
      className="overflow-hidden rounded-[10px] font-mono"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--window-shadow-sm)",
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: duration.slow, delay, ease }}
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
        <TrafficLights dim />
        <span
          className="flex-1 text-center text-muted-foreground/30 select-none text-xs"
        >
          system output
        </span>
        <span style={{ width: 54 }} />
      </div>
      {/* Lines */}
      <div className="px-5 py-4">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            className="flex gap-2 items-start py-[1px] -mx-2 px-2 hover:bg-accent/[0.03] transition-colors duration-150 text-mono rounded-[4px]"
            style={{ lineHeight: 1.7 }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.08 + i * stagger.base }}
          >
            <span
              className="shrink-0 font-medium"
              style={{
                color:
                  line.status === "OK"
                    ? "var(--ok)"
                    : line.status === "WARN"
                    ? "var(--signal-amber)"
                    : "var(--info)",
              }}
            >
              [ {line.status} ]
            </span>
            <span className="text-foreground/70">{line.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * "less" file viewer — macOS-style window with traffic lights
 */
export function LessViewer({
  filename,
  meta,
  children,
  delay = 0,
}: {
  filename: string;
  meta?: string;
  children: ReactNode;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.1);

  return (
    <motion.div
      ref={ref}
      className="overflow-hidden rounded-[10px]"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--window-shadow)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: duration.slow, delay, ease }}
      whileHover={{
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
        <TrafficLights />
        <span
          className="flex-1 text-center text-muted-foreground/45 select-none font-mono text-label"
        >
          {filename}
        </span>
        {meta && (
          <span
            className="text-muted-foreground/25 select-none font-mono text-3xs"
          >
            {meta}
          </span>
        )}
      </div>
      {/* Content */}
      <div className="p-5 md:p-7 font-mono">
        {children}
      </div>
    </motion.div>
  );
}
