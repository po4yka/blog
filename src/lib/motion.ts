// Shared animation constants for consistent motion across components

export const duration = {
  fast: 0.2,
  base: 0.35,
  slow: 0.5,
} as const;

export const ease = [0.25, 0.46, 0.45, 0.94] as const;

export const spring = {
  gentle: { type: "spring" as const, stiffness: 300, damping: 20 },
  snappy: { type: "spring" as const, stiffness: 400, damping: 15 },
} as const;

export const stagger = {
  fast: 0.04,
  base: 0.06,
} as const;
