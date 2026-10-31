import { m } from "motion/react";
import { useState, useCallback, useRef, type ReactNode } from "react";
import { duration } from "@/lib/motion";
import { Reveal } from "@/components/ui/Reveal";
import { AnimatedCheck } from "./AnimatedCheck";
import { T } from "@/components/ui/T";

/**
 * Command prompt. Static — no typing theatre. Click to copy.
 */
export function Cmd({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const textParts = el.querySelectorAll("[data-cmd-text]");
    const text = Array.from(textParts)
      .map((p) => p.textContent)
      .join("")
      .trim();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      });
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.key === " ") e.preventDefault();
        handleCopy();
      }
    },
    [handleCopy],
  );

  return (
    <Reveal
      ref={ref}
      className="flex items-baseline gap-2 group cursor-pointer font-mono text-mono-lg min-w-0 min-h-11 sm:min-h-0 active:opacity-70"
      speed="fast"
      delay={delay}
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <span
        className="select-none"
        style={{ color: "var(--emphasis)", fontWeight: 500 }}
      >
        $
      </span>
      {/* Accessible name = the visible command plus this suffix, so the
          name contains the label (WCAG 2.5.3) instead of replacing it. */}
      <span className="sr-only">
        (<T k="terminal.copyCommand" />)
      </span>
      <span
        data-cmd-text
        className="text-foreground min-w-0 break-all group-hover:opacity-100 transition-opacity duration-150"
        style={{ opacity: 0.92 }}
      >
        {children}
      </span>
      {/* The copied state is a fade only (rule A1/A3: no travel on press feedback). */}
      <m.span
        className="select-none flex items-center"
        style={{ color: "var(--muted-foreground)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: copied ? 1 : 0 }}
        transition={{ duration: duration.fast }}
      >
        {copied && <AnimatedCheck size={12} />}
      </m.span>
    </Reveal>
  );
}

/**
 * Output block with click-to-copy. Hairline left rule replaces the accent-tinted border.
 */
export function OutputBlock({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const text = el.textContent?.trim();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      });
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.key === " ") e.preventDefault();
        handleCopy();
      }
    },
    [handleCopy],
  );

  return (
    <Reveal
      ref={ref}
      className={`relative pl-6 md:pl-8 font-mono cursor-pointer group/output ${className}`}
      style={{ borderLeft: "1px solid var(--rule)" }}
      speed="slow"
      delay={delay}
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      title="Click to copy"
    >
      {children}
      <span className="sr-only">(click to copy)</span>
      <m.span
        className="absolute -top-1 right-0 flex items-center select-none"
        style={{ color: "var(--muted-foreground)" }}
        initial={{ opacity: 0 }}
        animate={copied ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: duration.fast }}
      >
        {copied && <AnimatedCheck size={12} />}
      </m.span>
    </Reveal>
  );
}
