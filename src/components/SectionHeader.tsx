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
}: {
  number: string;
  label: string;
  heading?: string | ReactNode;
  meta?: string | ReactNode;
  description?: string | ReactNode;
  id?: string;
  level?: 1 | 2;
  className?: string;
}) {
  const H = level === 1 ? "h1" : "h2";

  return (
    <header
      className={`space-y-2 pb-3 relative ${className}`}
    >
      <div className="flex items-baseline justify-between gap-4 min-w-0">
        <div className="flex items-baseline gap-2.5 min-w-0 truncate">
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
            className="shrink-0 text-right"
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
            fontSize: level === 1 ? undefined : "1.375rem",
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
        className="rule-draw absolute left-0 right-0 bottom-0 block"
        style={{ height: 1, background: "var(--rule)" }}
      />
    </header>
  );
}
