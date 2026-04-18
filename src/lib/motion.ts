// Shared animation constants for consistent motion across components.
// Industrial-console vocabulary: discrete stepping over continuous easing.

export const duration = {
  fast: 0.15,
  base: 0.3,
  slow: 0.45,
} as const;

// ease-out-quint: decisive deceleration, no mid-point compromise
export const ease = [0.22, 1, 0.36, 1] as const;

// Stepped easing — discrete interpolation for LED-meter / plotter-draw motion.
// Motion library accepts custom easing functions; CSS uses native `steps(N)`.
export const stepEase = (n: number) => (t: number): number => {
  if (t >= 1) return 1;
  return Math.floor(t * n) / n;
};
export const easeStep8 = stepEase(8);
export const easeStep24 = stepEase(24);

export const spring = {
  gentle: { type: "spring" as const, stiffness: 300, damping: 20 },
  hover: { type: "spring" as const, stiffness: 300, damping: 25 },
} as const;

export const stagger = {
  fast: 0.04,
  base: 0.06,
} as const;
