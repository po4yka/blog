import type { ReactNode } from "react";
import { DrawnRule } from "@/components/Terminal/windows";

/**
 * Admin page header in the SectionHeader voice: `NN / LABEL` meta row, the h1,
 * an optional description and actions, then a hairline that draws on load.
 */
export function AdminPageHeader({
  number,
  label,
  meta,
  title,
  description,
  actions,
}: {
  number: string;
  label: string;
  meta?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="relative mb-8 pb-5">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <span className="label-meta min-w-0 truncate">
          <span className="text-foreground">{number}</span>
          <span className="text-muted-foreground-dim"> / </span>
          {label}
        </span>
        {meta && (
          <span className="shrink-0 font-mono text-muted-foreground-dim" style={{ fontSize: 11, letterSpacing: "0.04em" }}>
            {meta}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 600, lineHeight: 1.2 }}>
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-muted-foreground" style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <DrawnRule />
    </header>
  );
}
