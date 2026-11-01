// Telemetry response shapes and ranges, shared by the Worker (src/lib/telemetry.ts) and the
// admin page. Kept apart so the browser bundle never includes the server-side query code.

export const TELEMETRY_RANGES = ["24h", "7d", "30d"] as const;
export type TelemetryRange = (typeof TELEMETRY_RANGES)[number];

export type Section<T> =
  | { status: "ok"; data: T }
  | { status: "unconfigured"; missing: string[] }
  | { status: "error"; message: string };

export type Top = { label: string; count: number };
export type Pair = { now: number; prev: number | null };

export interface VisitsData {
  pageviews: Pair;
  visitors: Pair;
  visits: Pair;
  bounces: Pair;
  totaltimeSec: Pair;
  active: number | null;
  pages: Top[];
  referrers: Top[];
  countries: Top[];
  events: Top[];
}

export interface EdgeData {
  requests: number;
  bytes: number;
  visits: number;
  status: Record<"2xx" | "3xx" | "4xx" | "5xx", number>;
  cache: Top[];
  countries: Top[];
  notFound: Top[];
  probes: Top[];
}

export interface FirewallData {
  total: number;
  actions: Top[];
}

export interface WorkerData {
  requests: number;
  errors: number;
  subrequests: number;
  cpuP50Ms: number;
  cpuP99Ms: number;
}

export interface D1Data {
  /** Per UTC day; null when auth_failures_daily is missing (migration 007 not applied). */
  failures: { day: string; count: number }[] | null;
  activeSessions: number;
  passkeys: number;
  rows: Top[];
}

export interface Telemetry {
  range: TelemetryRange;
  generatedAt: string;
  visits: Section<VisitsData>;
  edge: Section<EdgeData>;
  firewall: Section<FirewallData>;
  worker: Section<WorkerData>;
  d1: Section<D1Data>;
}

