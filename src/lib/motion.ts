// Shared animation constants for consistent motion across components.
// Industrial-console vocabulary: discrete stepping over continuous easing.

// Seconds, for Motion. Mirrors the --dur-* tokens in src/styles/tokens.css.
export const duration = {
  instant: 0.08,
  fast: 0.15,
  base: 0.24,
  slow: 0.42,
  scene: 0.7,
} as const;

// ease-out-quint: decisive deceleration, no mid-point compromise (--ease-out)
export const ease = [0.22, 1, 0.36, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Sets data-motion="reduce" on <html> when the OS or the visitor asks for
 * reduced motion; tokens.css keys every reduced-motion rule off it.
 */
export function applyReducedMotion(storedPreference: boolean): void {
  const reduce = storedPreference || window.matchMedia(REDUCE_QUERY).matches;
  if (reduce) document.documentElement.setAttribute("data-motion", "reduce");
  else document.documentElement.removeAttribute("data-motion");
}

export function onSystemReducedMotionChange(listener: () => void): void {
  window.matchMedia(REDUCE_QUERY).addEventListener("change", listener);
}

// Stepped easing — discrete interpolation for LED-meter / plotter-draw motion.
// Motion library accepts custom easing functions; CSS uses native `steps(N)`.
const stepEase = (n: number) => (t: number): number => {
  if (t >= 1) return 1;
  return Math.floor(t * n) / n;
};
export const easeStep8 = stepEase(8);

export const stagger = {
  fast: 0.04,
  base: 0.06,
  // DESIGN.md list-reveal cadence: 120-150ms per item for editorial list rows
  list: 0.12,
} as const;
