import type { ReactNode } from "react";

/**
 * Operator-console section header: numbered label + h2 heading + hairline rule.
 *
 *   04 / PROJECTS                           8 RECORDS · 2025–26
 *   Selected work across mobile and platform engineering
 *   ──────────────────────────────────────────────────────────
 *
 * `number` renders in Geist Pixel; `label` in Geist Mono caps; `heading` is the
 * real <h2>; `meta` is a right-aligned technical string.
 *
 * No hooks, so it also renders inside server-only sections. The hairline draws
 * on first render (.rule-draw), or as the header scrolls into view where scroll
 * timelines exist (.rule-scroll, scroll.css); its final state is the full rule.
 *
 * `marks` puts registration marks on the hairline ends. They sit on the outer
 * guide lines only when the header spans the page grid, so narrow or nested
 * headers pass `marks={false}`.
 */
export function SectionHeader({
  number,
  label,
  heading,
  meta,
  description,
  id,
  level = 2,
  className = "",
  marks = true,
}: {
  number: string;
  label: string;
  heading?: string | ReactNode;
  meta?: string | ReactNode;
  description?: string | ReactNode;
  id?: string;
  level?: 1 | 2;
  className?: string;
  marks?: boolean;
}) {
  const H = level === 1 ? "h1" : "h2";

  return (
    <header className={`${marks ? "reg-marks " : ""}space-y-2 pb-3 relative ${className}`}>
      <div className="flex items-baseline justify-between gap-4 min-w-0">
        {/* The number and label keep their width; a long meta (often in Russian) truncates instead. */}
        <div className="flex items-baseline gap-2.5 shrink-0">
          <span
            aria-hidden="true"
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "11px",
              color: "var(--muted-foreground)",
              letterSpacing: "0.08em",
            }}
          >
            {number}
          </span>
          <span className="label-meta truncate">/ {label}</span>
        </div>
        {meta && (
          <span
            className="min-w-0 truncate text-right"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--muted-foreground-dim)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {meta}
          </span>
        )}
      </div>
      {heading && (
        <H
          id={id}
          className="text-foreground"
          style={{
            // Page titles (level 1) share the section-header size so promoting
            // the element to <h1> for a correct document outline does not alter
            // the operator-console visual hierarchy.
            fontSize: "1.25rem",
            fontWeight: 500,
            letterSpacing: "-0.012em",
            lineHeight: 1.2,
          }}
        >
          {heading}
        </H>
      )}
      {description && (
        <p
          className="text-muted-foreground"
          style={{ fontSize: "0.9375rem", lineHeight: 1.55, maxWidth: "36rem" }}
        >
          {description}
        </p>
      )}
      <span
        aria-hidden="true"
        className="rule-draw rule-scroll absolute left-0 right-0 bottom-0 block"
        style={{ height: 1, background: "var(--rule)" }}
      />
    </header>
  );
}
