import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { type ReactNode } from "react";
import { ease, duration, stagger } from "@/lib/motion";

/**
 * Panel frame — operator-console minimal: hairline border, thin label row,
 * no window chrome. Keeps prior props for back-compat.
 *
 * Optional density props:
 *   sectionNumber — `01`, `02`… for the operator-console left-label prefix
 *   lineNumbers   — opt-in line-number gutter (count or `true` for 10 rows)
 *   statusLine    — bottom meta line (true for default vim-style string)
 *   titleExt      — right-side metadata (path, branch, mode)
 */
export function MacWindow({
  title,
  label,
  sectionNumber,
  subtitle,
  children,
  delay = 0,
  className = "",
  lineNumbers,
  statusLine,
  titleExt,
}: {
  title?: string;
  /** Preferred name for new call sites. Falls back to `title`. */
  label?: string;
  sectionNumber?: string;
  subtitle?: string;
  children: ReactNode;
  delay?: number;
  className?: string;
  lineNumbers?: boolean | number;
  statusLine?: boolean | string | ReactNode;
  titleExt?: string;
}) {
  const { ref, inView } = useInView(0.1);
  const lineCount = typeof lineNumbers === "number" ? lineNumbers : lineNumbers ? 10 : 0;
  const resolvedLabel = (label ?? title ?? "").toString();

  const defaultStatus = resolvedLabel
    ? `${resolvedLabel}  ·  ${lineCount || 1}:1  ·  main`
    : `1:1  ·  main`;
  const statusContent = statusLine === true ? defaultStatus : statusLine || null;

  const hasHeader = resolvedLabel || sectionNumber || titleExt || subtitle;

  return (
    <motion.div
      ref={ref}
      className={`overflow-hidden ${className}`}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "2px",
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: duration.slow, delay, ease }}
    >
      {hasHeader && (
        <div
          className="flex items-baseline justify-between gap-4 px-4 py-2"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          <span className="label-meta min-w-0 truncate">
            {sectionNumber && (
              <>
                <span className="text-foreground">{sectionNumber}</span>
                <span className="text-muted-foreground-dim"> / </span>
              </>
            )}
            {resolvedLabel}
          </span>
          {(titleExt || subtitle) && (
            <span
              className="shrink-0 text-right font-mono"
              style={{
                fontSize: 11,
                color: "var(--muted-foreground-dim)",
                letterSpacing: "0.04em",
              }}
            >
              {titleExt || subtitle}
            </span>
          )}
        </div>
      )}

      <div className={`flex font-mono ${lineCount > 0 ? "gap-0" : ""}`}>
        {lineCount > 0 && (
          <div
            className="flex-none select-none py-5 pl-3 pr-2 text-right font-mono text-mono-sm"
            style={{
              color: "var(--muted-foreground-dim)",
              borderRight: "1px solid var(--border)",
              minWidth: "2.5rem",
              lineHeight: 1.75,
            }}
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1}>{String(i + 1).padStart(2, "0")}</div>
            ))}
          </div>
        )}
        <div className="flex-1 min-w-0 p-5 md:p-6">{children}</div>
      </div>

      {statusContent && (
        <div
          className="px-4 py-1.5 font-mono text-xs select-none truncate"
          style={{
            borderTop: "1px solid var(--rule)",
            color: "var(--muted-foreground-dim)",
            letterSpacing: "0.06em",
          }}
          aria-hidden="true"
        >
          {statusContent}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Boot status block — neutral operator log, no colour-coded signals.
 * Status is conveyed by the label token itself in mono caps.
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
      className="overflow-hidden font-mono"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "2px",
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: duration.slow, delay, ease }}
    >
      <div
        className="flex items-baseline justify-between px-4 py-2"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <span className="label-meta">System log</span>
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: "var(--muted-foreground-dim)",
            letterSpacing: "0.04em",
          }}
        >
          {lines.length} lines
        </span>
      </div>
      <div className="px-5 py-4">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            className="flex gap-3 items-start py-[2px] text-mono"
            style={{ lineHeight: 1.7 }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.25, delay: delay + 0.05 + i * stagger.base }}
          >
            <span
              className="shrink-0 font-mono font-medium"
              style={{
                color: "var(--muted-foreground)",
                fontSize: 11,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                minWidth: "3.5rem",
                paddingTop: "2px",
              }}
            >
              {line.status} ·
            </span>
            <span className="text-foreground/90">{line.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * File viewer — flat operator panel, hairline border.
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
  return (
    <motion.div
      className="overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "2px",
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.slow, delay, ease }}
    >
      <div
        className="flex items-baseline justify-between gap-3 px-4 py-2"
        style={{ borderBottom: "1px solid var(--rule)" }}
      >
        <span className="label-meta truncate">{filename}</span>
        {meta && (
          <span
            className="shrink-0 font-mono"
            style={{
              fontSize: 11,
              color: "var(--muted-foreground-dim)",
              letterSpacing: "0.04em",
            }}
          >
            {meta}
          </span>
        )}
      </div>
      <div className="p-5 md:p-7 font-mono">{children}</div>
    </motion.div>
  );
}
