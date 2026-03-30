export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function barColor(pct: number): string {
  if (pct >= 80) return "var(--signal-red)";
  if (pct >= 50) return "var(--signal-yellow)";
  return "var(--signal-green)";
}
