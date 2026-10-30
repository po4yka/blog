import type { ReactNode } from "react";

/** Emphasis text: full-luminance --emphasis at weight 500. No chromatic accent. */
export function Em({ children }: { children: ReactNode }) {
  return <span className="text-emphasis font-medium">{children}</span>;
}

/**
 * Tag / metadata chip — flat, hairline, static. No hover motion.
 */
export function Tag({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "highlight";
}) {
  return (
    <span
      className="inline-block px-2 py-0.5 cursor-default font-mono text-xs uppercase"
      style={{
        letterSpacing: "0.08em",
        color: variant === "highlight" ? "var(--emphasis)" : "var(--muted-foreground)",
        background: "transparent",
        border: `1px solid ${variant === "highlight" ? "var(--foreground)" : "var(--border)"}`,
        borderRadius: 2,
      }}
    >
      {children}
    </span>
  );
}
