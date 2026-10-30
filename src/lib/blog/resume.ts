// Entries below 5% or past 95% are dropped: nothing worth resuming there.
export const RESUME_MIN = 5;
export const RESUME_MAX = 95;

export const resumeKey = (lang: string, slug: string) => `read:${lang}/${slug}`;

/** The saved percent if it is a number inside the resumable range, else null. */
export function parseResume(raw: string | null): number | null {
  const value = raw == null ? NaN : Number(raw);
  return Number.isFinite(value) && value >= RESUME_MIN && value <= RESUME_MAX ? value : null;
}

export function resumeAction(percent: number): "save" | "clear" | "none" {
  if (percent >= RESUME_MIN && percent <= RESUME_MAX) return "save";
  if (percent > RESUME_MAX) return "clear";
  return "none";
}

// Not clamped: a viewport taller than the page gives a negative value.
export function resumeScrollTop(saved: number, scrollHeight: number, innerHeight: number): number {
  return (saved / 100) * (scrollHeight - innerHeight);
}
