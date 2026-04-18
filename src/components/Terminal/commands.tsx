import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { useState, useCallback, type ReactNode } from "react";
import { ease, duration } from "@/lib/motion";
import { AnimatedCheck } from "./AnimatedCheck";

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
  const { ref, inView } = useInView(0.1);
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
  }, [ref]);

  return (
    <motion.div
      ref={ref}
      className="flex items-baseline gap-2 group cursor-pointer font-mono text-mono-lg"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: duration.fast, delay, ease }}
      onClick={handleCopy}
      title="Click to copy command"
    >
      <span
        className="select-none"
        style={{ color: "var(--emphasis)", fontWeight: 500 }}
      >
        $
      </span>
      <span
        data-cmd-text
        className="text-foreground whitespace-nowrap group-hover:opacity-100 transition-opacity duration-200"
        style={{ opacity: 0.92 }}
      >
        {children}
      </span>
      <motion.span
        className="select-none flex items-center"
        style={{ color: "var(--muted-foreground)" }}
        initial={{ opacity: 0, x: -4 }}
        animate={copied ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
        transition={{ duration: duration.fast }}
      >
        {copied && <AnimatedCheck size={12} />}
      </motion.span>
      {!copied && (
        <span
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none text-xs"
          style={{ color: "var(--muted-foreground-dim)" }}
        >
          ⌘C
        </span>
      )}
    </motion.div>
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
  const { ref, inView } = useInView(0.1);
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
  }, [ref]);

  return (
    <motion.div
      ref={ref}
      className={`relative pl-6 md:pl-8 font-mono cursor-pointer group/output ${className}`}
      style={{ borderLeft: "1px solid var(--rule)" }}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: duration.slow, delay, ease }}
      onClick={handleCopy}
      title="Click to copy"
    >
      {children}
      <motion.span
        className="absolute -top-1 right-0 flex items-center select-none"
        style={{ color: "var(--muted-foreground)" }}
        initial={{ opacity: 0 }}
        animate={copied ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: duration.fast }}
      >
        {copied && <AnimatedCheck size={12} />}
      </motion.span>
    </motion.div>
  );
}
