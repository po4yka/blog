import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "./useInView";
import { useSettings } from "@/stores/settingsStore";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedNumber({
  value,
  suffix = "",
  duration = 800,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const { ref, inView } = useInView(0.1);
  const { reduceMotion } = useSettings();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current || reduceMotion) return;
    started.current = true;

    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, value, duration, reduceMotion]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/** Minimum digits for a number to be animated (skip "2", animate "18", "80+", "70%") */
const MIN_DIGITS = 2;

const NUMBER_PATTERN = /(\d+)([+%k]?)/g;

/**
 * Parse a text string and wrap significant numeric patterns in AnimatedNumber.
 * Numbers with fewer than MIN_DIGITS digits and no suffix are left as plain text.
 */
export function animateNumbers(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  NUMBER_PATTERN.lastIndex = 0;
  while ((match = NUMBER_PATTERN.exec(text)) !== null) {
    const [full, digits, suffix] = match;
    const numValue = parseInt(digits!, 10);
    const shouldAnimate = digits!.length >= MIN_DIGITS || suffix;

    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (shouldAnimate) {
      parts.push(
        <AnimatedNumber key={match.index} value={numValue} suffix={suffix} />,
      );
    } else {
      parts.push(full);
    }

    lastIndex = match.index + full!.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
