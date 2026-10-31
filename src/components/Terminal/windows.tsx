import { type ReactNode } from "react";
import { stagger } from "@/lib/motion";
import { Panel, type PanelProps } from "@/components/ui/Panel";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Header hairline that draws left to right on first render, the same steps(24)
 * plotter cadence as SectionHeader. Inside a Reveal panel it inherits the
 * panel's --reveal-delay, so every panel in the kit (OperatorPanel, BootBlock,
 * LessViewer, PanelShell) shows in one order: frame, rule, content.
 * Parent must be position: relative.
 */
export function DrawnRule({ edge = "bottom" }: { edge?: "top" | "bottom" }) {
  return (
    <span
      aria-hidden="true"
      className="rule-draw absolute left-0 right-0 block"
      style={{ [edge]: 0, height: 1, background: "var(--rule)" }}
    />
  );
}

/** Content reveal that follows the rule draw: a short fade, no travel. */
export const REVEAL_AFTER_RULE = 0.2;

/** A Panel that fades in on first render, after `delay` seconds. */
export function RevealPanel({ delay = 0, instant = false, ...panel }: PanelProps & { delay?: number; instant?: boolean }) {
  return <Reveal as={Panel} delay={delay} instant={instant} {...panel} />;
}

/**
 * Operator panel — hairline border, thin label row, no window chrome.
 *
 * Optional density props:
 *   sectionNumber — `01`, `02`… for the operator-console left-label prefix
 *   lineNumbers   — opt-in line-number gutter (count or `true` for 10 rows)
 *   statusLine    — bottom meta line (true for default vim-style string)
 *   titleExt      — right-side metadata (path, branch, mode)
 */
export function OperatorPanel({
  label,
  sectionNumber,
  children,
  delay = 0,
  className = "",
  lineNumbers,
  statusLine,
  titleExt,
  instant = false,
}: {
  label?: string;
  sectionNumber?: string;
  children: ReactNode;
  delay?: number;
  className?: string;
  lineNumbers?: boolean | number;
  statusLine?: boolean | string | ReactNode;
  titleExt?: string;
  /** Skip the entrance fade. Use for above-the-fold LCP content. */
  instant?: boolean;
}) {
  const lineCount = typeof lineNumbers === "number" ? lineNumbers : lineNumbers ? 10 : 0;
  const resolvedLabel = label ?? "";

  const defaultStatus = resolvedLabel
    ? `${resolvedLabel}  ·  ${lineCount || 1}:1  ·  main`
    : `1:1  ·  main`;
  const statusContent = statusLine === true ? defaultStatus : statusLine || null;

  const hasHeader = resolvedLabel || sectionNumber || titleExt;
  const body = (
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
  );
  const frameClass = className || undefined;

  const content = (
    <>
      {hasHeader && (
        <div className="relative flex items-baseline justify-between gap-4 px-4 py-2">
          <span className="label-meta min-w-0 truncate">
            {sectionNumber && (
              <>
                <span className="text-foreground">{sectionNumber}</span>
                <span className="text-muted-foreground-dim"> / </span>
              </>
            )}
            {resolvedLabel}
          </span>
          {titleExt && (
            <span
              className="shrink-0 text-right font-mono"
              style={{
                fontSize: 11,
                color: "var(--muted-foreground-dim)",
                letterSpacing: "0.04em",
              }}
            >
              {titleExt}
            </span>
          )}
          <DrawnRule />
        </div>
      )}

      <Reveal delay={delay + REVEAL_AFTER_RULE} instant={instant}>
        {body}
      </Reveal>

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
    </>
  );

  return (
    <Reveal as={Panel} className={frameClass} delay={delay} instant={instant}>
      {content}
    </Reveal>
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
  return (
    <RevealPanel delay={delay} className="font-mono">
      <div className="relative flex items-baseline justify-between px-4 py-2">
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
        <DrawnRule />
      </div>
      <div className="px-5 py-4">
        {lines.map((line, i) => (
          <Reveal
            key={i}
            className="flex gap-3 items-start py-[2px] text-mono"
            style={{ lineHeight: 1.7 }}
            delay={delay + REVEAL_AFTER_RULE + i * stagger.base}
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
          </Reveal>
        ))}
      </div>
    </RevealPanel>
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
  statusLine,
  instant = false,
}: {
  filename: string;
  meta?: string;
  children: ReactNode;
  delay?: number;
  /** Skip the panel and body fades. Use for the LCP body of a post. */
  instant?: boolean;
  /** Bottom pager bar, mirroring OperatorPanel's statusLine treatment. */
  statusLine?: ReactNode;
}) {
  return (
    /* clip (not hidden): clips to the 2px radius without creating a scroll
       container, so position:sticky children (blog TOC) keep sticking. */
    <RevealPanel delay={delay} clip="clip" instant={instant}>
      <div className="relative flex items-baseline justify-between gap-3 px-4 py-2">
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
        <DrawnRule />
      </div>
      <Reveal className="p-5 md:p-7 font-mono" delay={delay + REVEAL_AFTER_RULE} instant={instant}>
        {children}
      </Reveal>

      {statusLine && (
        <div
          className="px-4 py-1.5 font-mono text-xs select-none truncate"
          style={{
            borderTop: "1px solid var(--rule)",
            color: "var(--muted-foreground-dim)",
            letterSpacing: "0.06em",
            fontVariantNumeric: "tabular-nums",
          }}
          aria-hidden="true"
        >
          {statusLine}
        </div>
      )}
    </RevealPanel>
  );
}
