import type { ReactNode } from "react";

/**
 * Emphasis text helper. Neutral greyscale system — emphasis is full-luminance
 * (`--emphasis`), not a chromatic accent. Kept as `Accent` for source
 * compatibility with existing call sites.
 */
export function Accent({ children }: { children: ReactNode; glow?: boolean }) {
  return (
    <span
      style={{
        color: "var(--emphasis)",
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
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
