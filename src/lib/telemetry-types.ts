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

export interface ReadingRow {
  slug: string;
  title: string;
  /** Pageviews of the post in both languages. */
  pageviews: number;
  /** `blog-read-complete` events: the reader reached the end marker. */
  completions: number;
  /** null when the post has no word count in its metadata. */
  words: number | null;
  readingMin: number | null;
  /** The post URL: English when the post has an English version, otherwise Russian. */
  href: string;
}

export interface ReadingData {
  posts: ReadingRow[];
  /** How many most-viewed paths the pageview counts come from. */
  pathLimit: number;
}

/** One point of a time series; `t` is an ISO date or date-time. */
export type Point = { t: string; value: number };

export interface VisitTrendData {
  unit: "hour" | "day";
  pageviews: Point[];
  /** null when Umami returned no session series. */
  sessions: Point[] | null;
}

export interface EdgeTrendData {
  requests: Point[];
  errors5xx: Point[];
}

export interface Deploy {
  at: string;
  commit: string;
  url: string;
}

export interface CrawlerRow {
  name: string;
  kind: "ai" | "search" | "feed" | "other";
  requests: number;
  paths: Top[];
}

export interface FeedReader {
  name: string;
  feed: string;
  /** Subscriber count the reader reports in its user agent. */
  subscribers: number;
}

export interface CrawlersData {
  /** Requests to llms.txt, llms-full.txt, robots.txt, sitemaps, RSS and post .md files. */
  total: number;
  crawlers: CrawlerRow[];
  feedReaders: FeedReader[];
  /** True when Cloudflare returned the query's full group limit, so the rarest path/agent pairs are cut. */
  truncated: boolean;
}

export interface OriginsData {
  /** Networks behind 4xx responses. */
  networks: { asn: number; name: string; requests: number }[];
  /** Countries behind requests to scanner paths. */
  probeCountries: Top[];
}

export interface LighthouseRow {
  formFactor: "desktop" | "mobile";
  path: string;
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  lcpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
}

export interface LighthouseData {
  /** null when no deploy has stored Lighthouse results yet. */
  latest: { commit: string; measuredAt: string; rows: LighthouseRow[] } | null;
  /** Average performance score per deploy and form factor, oldest first. */
  history: { commit: string; measuredAt: string; formFactor: "desktop" | "mobile"; performance: number }[];
}

export interface Telemetry {
  range: TelemetryRange;
  generatedAt: string;
  visits: Section<VisitsData>;
  edge: Section<EdgeData>;
  firewall: Section<FirewallData>;
  worker: Section<WorkerData>;
  d1: Section<D1Data>;
  reading: Section<ReadingData>;
  visitTrend: Section<VisitTrendData>;
  edgeTrend: Section<EdgeTrendData>;
  deploys: Section<Deploy[]>;
  crawlers: Section<CrawlersData>;
  origins: Section<OriginsData>;
  lighthouse: Section<LighthouseData>;
}

