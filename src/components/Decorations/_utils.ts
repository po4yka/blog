export function createSeededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function barColor(): string {
  // Neutral grayscale — no chromatic signal colors
  return "var(--muted-foreground)";
}
