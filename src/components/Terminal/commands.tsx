import { motion } from "motion/react";
import { useInView } from "@/components/useInView";
import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { ease, duration } from "@/lib/motion";
import { useSettingsStore } from "@/stores/settingsStore";

const TYPING_SPEED_MS = 35;

/**
 * Command prompt with per-character typing reveal — click to copy command text
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
  const [revealedChars, setRevealedChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [typingStarted, setTypingStarted] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  const typingDone = totalChars > 0 && revealedChars >= totalChars;

  // Measure total character count once text is rendered
  useEffect(() => {
    if (textRef.current) {
      setTotalChars(textRef.current.textContent?.length ?? 0);
    }
  }, [children]);

  // Start typing when in view (after delay)
  useEffect(() => {
    if (!inView || typingStarted) return;

    const reduceMotion = useSettingsStore.getState().reduceMotion;
    const timeout = setTimeout(() => {
      setTypingStarted(true);
      if (reduceMotion || totalChars === 0) {
        setRevealedChars(totalChars);
        return;
      }

      let charIdx = 0;
      const id = setInterval(() => {
        charIdx++;
        setRevealedChars(charIdx);
        if (charIdx >= totalChars) clearInterval(id);
      }, TYPING_SPEED_MS);

      // Cleanup if unmounted during typing
      return () => clearInterval(id);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [inView, typingStarted, delay, totalChars]);

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
      {/* $ prompt -- appears immediately */}
      <span className="text-accent/60 select-none group-hover:text-accent transition-colors duration-200">
        $
      </span>
      {/* Command text -- revealed character by character */}
      <span
        className="inline-flex items-baseline overflow-hidden whitespace-nowrap"
        style={{ width: typingStarted ? `${revealedChars}ch` : "0ch" }}
      >
        <span
          ref={textRef}
          data-cmd-text
          className="text-foreground/90 group-hover:text-foreground transition-colors duration-200 whitespace-nowrap"
        >
          {children}
        </span>
      </span>
      {/* Blinking cursor -- visible once typing starts */}
      {typingStarted && (
        <span
          className="text-accent/40 select-none"
          style={{ animation: "blink 1s step-end infinite" }}
        >
          _
        </span>
      )}
      {/* Copy indicator */}
      <motion.span
        className="text-accent/60 select-none text-xs"
        initial={{ opacity: 0, x: -4 }}
        animate={copied ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
        transition={{ duration: duration.fast }}
      >
        {copied ? "copied!" : ""}
      </motion.span>
      {/* Copy icon hint on hover -- only after typing completes */}
      {!copied && typingDone && (
        <span
          className="text-muted-foreground/0 group-hover:text-muted-foreground/30 transition-colors duration-200 select-none text-xs"
        >
          ⌘C
        </span>
      )}
    </motion.div>
  );
}

/**
 * Styled output block
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

  return (
    <motion.div
      ref={ref}
      className={`border-l-2 border-accent/15 pl-6 md:pl-8 hover:border-accent/30 transition-colors duration-300 font-mono ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: duration.slow, delay, ease }}
    >
      {children}
    </motion.div>
  );
}
