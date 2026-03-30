import type { ReactNode } from "react";
import { AnimatedNumber } from "./AnimatedNumber";

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

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
