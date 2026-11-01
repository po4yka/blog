// Number and label formatting shared by the Telemetry panels.

export const meta = { fontSize: "max(11px, 0.6875rem)", letterSpacing: "0.04em" } as const;
export const mono = { fontSize: "max(11px, 0.75rem)" } as const;
export const statGrid = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5";

export const fmt = (n: number) => n.toLocaleString("en");

export function bytes(n: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function duration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

/** "+12% vs previous" against the comparison period, when there is one. */
export function delta(now: number, prev: number | null): string | null {
  if (prev === null || prev === 0) return null;
  const pct = Math.round(((now - prev) / prev) * 100);
  return `${pct > 0 ? "+" : ""}${pct}% vs previous`;
}

/** Milliseconds for an ISO time or a SQLite "YYYY-MM-DD HH:MM:SS" (UTC) time. */
export const timeMs = (t: string) => Date.parse(t.includes("T") ? t : `${t.replace(" ", "T")}Z`);

export function shortTime(t: string, unit: "hour" | "day"): string {
  const d = new Date(timeMs(t));
  return unit === "hour"
    ? d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC"
    : d.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
}

export const pct = (n: number | null) => (n === null ? "–" : `${Math.round(n * 100)}`);
