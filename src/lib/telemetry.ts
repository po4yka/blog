// Data for the admin Telemetry page. Every section comes from a real source
// (self-hosted Umami, the Cloudflare GraphQL Analytics API, D1) and reports
// "unconfigured" or "error" instead of inventing numbers.

import { UMAMI_ORIGIN } from "@/lib/constants";
import type {
  D1Data,
  EdgeData,
  FirewallData,
  Pair,
  Section,
  Telemetry,
  TelemetryRange,
  Top,
  VisitsData,
  WorkerData,
} from "@/lib/telemetry-types";

const RANGE_DAYS: Record<TelemetryRange, number> = { "24h": 1, "7d": 7, "30d": 30 };
const WORKER_SCRIPT = "po4yka-blog";
const CF_GRAPHQL = "https://api.cloudflare.com/client/v4/graphql";

/** Paths that only scanners ask for on this site: it runs no PHP, WordPress or exposed dotfiles. */
export const PROBE_PATHS = [
  "/wp-login.php",
  "/wp-admin/",
  "/xmlrpc.php",
  "/wp-config.php",
  "/.env",
  "/.git/config",
  "/.aws/credentials",
  "/phpmyadmin/",
  "/admin.php",
  "/config.php",
  "/server-status",
  "/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php",
];

export interface TelemetryEnv {
  UMAMI_API_TOKEN?: string;
  UMAMI_WEBSITE_ID?: string;
  CLOUDFLARE_ANALYTICS_TOKEN?: string;
  CLOUDFLARE_ZONE_ID?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
}

type Fetch = typeof fetch;

function missing(env: TelemetryEnv, keys: (keyof TelemetryEnv)[]): string[] {
  return keys.filter((k) => !env[k]);
}

async function section<T>(env: TelemetryEnv, keys: (keyof TelemetryEnv)[], load: () => Promise<T>): Promise<Section<T>> {
  const absent = missing(env, keys);
  if (absent.length > 0) return { status: "unconfigured", missing: absent };
  try {
    return { status: "ok", data: await load() };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

// --- Umami ---

/**
 * Current Umami returns `{ pageviews: 5, comparison: { pageviews: 4 } }`; Umami 2.x
 * returns `{ pageviews: { value: 5, prev: 4 } }`. Self-hosted instances run either.
 */
export function umamiPair(stats: Record<string, unknown>, key: string): Pair {
  const v = stats[key];
  if (typeof v === "number") {
    const prev = (stats.comparison as Record<string, unknown> | undefined)?.[key];
    return { now: v, prev: typeof prev === "number" ? prev : null };
  }
  if (v && typeof v === "object") {
    const o = v as { value?: unknown; prev?: unknown };
    return { now: typeof o.value === "number" ? o.value : 0, prev: typeof o.prev === "number" ? o.prev : null };
  }
  return { now: 0, prev: null };
}

async function loadVisits(env: TelemetryEnv, range: TelemetryRange, f: Fetch): Promise<VisitsData> {
  const endAt = Date.now();
  const startAt = endAt - RANGE_DAYS[range] * 86_400_000;
  const base = `${UMAMI_ORIGIN}/api/websites/${encodeURIComponent(env.UMAMI_WEBSITE_ID!)}`;
  const request = (path: string) =>
    f(`${base}${path}`, { headers: { Authorization: `Bearer ${env.UMAMI_API_TOKEN}`, Accept: "application/json" } });
  const get = async (path: string): Promise<unknown> => {
    const res = await request(path);
    if (!res.ok) throw new Error(`Umami ${path.split("?")[0] || "/"} returned ${res.status}`);
    return res.json();
  };
  const window = `startAt=${startAt}&endAt=${endAt}`;
  /** Tries each metric type name in turn while Umami answers 400 (an unsupported type). */
  const metric = async (...types: string[]): Promise<Top[]> => {
    for (const [i, type] of types.entries()) {
      const res = await request(`/metrics?${window}&type=${type}&limit=8`);
      if (res.status === 400 && i < types.length - 1) continue;
      if (!res.ok) throw new Error(`Umami /metrics?type=${type} returned ${res.status}`);
      const rows: unknown = await res.json();
      if (!Array.isArray(rows)) throw new Error(`Umami /metrics?type=${type} did not return a list`);
      return (rows as { x: string | null; y: number }[]).slice(0, 8).map((r) => ({ label: r.x || "(none)", count: r.y }));
    }
    return [];
  };

  const [stats, active, pages, referrers, countries, events] = await Promise.all([
    get(`/stats?${window}&compare=prev`) as Promise<Record<string, unknown>>,
    get("/active").catch(() => null) as Promise<{ visitors?: number; x?: number } | null>,
    // Current Umami calls the page dimension "path"; Umami 2.x calls it "url" and rejects "path" with 400.
    metric("path", "url"),
    metric("referrer"),
    metric("country"),
    metric("event"),
  ]);
  return {
    pageviews: umamiPair(stats, "pageviews"),
    visitors: umamiPair(stats, "visitors"),
    visits: umamiPair(stats, "visits"),
    bounces: umamiPair(stats, "bounces"),
    totaltimeSec: umamiPair(stats, "totaltime"),
    active: active ? (active.visitors ?? active.x ?? null) : null,
    pages,
    referrers,
    countries,
    events,
  };
}

// --- Cloudflare GraphQL Analytics ---

async function cfQuery<T>(env: TelemetryEnv, query: string, variables: Record<string, unknown>, f: Fetch): Promise<T> {
  const res = await f(CF_GRAPHQL, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.CLOUDFLARE_ANALYTICS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Cloudflare GraphQL returned ${res.status}`);
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] | null };
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join("; "));
  if (!body.data) throw new Error("Cloudflare GraphQL returned no data");
  return body.data;
}

type Group<D> = { count: number; dimensions: D };

export function statusBuckets(groups: Group<{ edgeResponseStatus: number }>[]): EdgeData["status"] {
  const out = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
  for (const g of groups) {
    const key = `${Math.floor(g.dimensions.edgeResponseStatus / 100)}xx`;
    if (key in out) out[key as keyof typeof out] += g.count;
  }
  return out;
}

const top = <D>(groups: Group<D>[], pick: (d: D) => string | number | null): Top[] =>
  groups.map((g) => ({ label: String(pick(g.dimensions) || "(none)"), count: g.count }));

/** Cloudflare panels always cover the last 24 hours: the widest query window differs per plan. */
function lastDay() {
  const until = new Date();
  return { since: new Date(until.getTime() - 86_400_000).toISOString(), until: until.toISOString() };
}

async function loadEdge(env: TelemetryEnv, f: Fetch): Promise<EdgeData> {
  const filter = `{ datetime_geq: $since, datetime_lt: $until, requestSource: "eyeball" }`;
  const withFilter = (extra: string) => `{ datetime_geq: $since, datetime_lt: $until, requestSource: "eyeball", ${extra} }`;
  const query = `query Edge($zone: string, $since: Time, $until: Time) {
    viewer { zones(filter: { zoneTag: $zone }) {
      totals: httpRequestsAdaptiveGroups(limit: 1, filter: ${filter}) { count sum { edgeResponseBytes visits } }
      status: httpRequestsAdaptiveGroups(limit: 100, filter: ${filter}, orderBy: [count_DESC]) { count dimensions { edgeResponseStatus } }
      cache: httpRequestsAdaptiveGroups(limit: 10, filter: ${filter}, orderBy: [count_DESC]) { count dimensions { cacheStatus } }
      countries: httpRequestsAdaptiveGroups(limit: 8, filter: ${filter}, orderBy: [count_DESC]) { count dimensions { clientCountryName } }
      notFound: httpRequestsAdaptiveGroups(limit: 8, filter: ${withFilter("edgeResponseStatus: 404")}, orderBy: [count_DESC]) { count dimensions { clientRequestPath } }
      probes: httpRequestsAdaptiveGroups(limit: 20, filter: ${withFilter(`clientRequestPath_in: ${JSON.stringify(PROBE_PATHS)}`)}, orderBy: [count_DESC]) { count dimensions { clientRequestPath } }
    } }
  }`;
  type Zone = {
    totals: { count: number; sum: { edgeResponseBytes: number; visits: number } }[];
    status: Group<{ edgeResponseStatus: number }>[];
    cache: Group<{ cacheStatus: string }>[];
    countries: Group<{ clientCountryName: string }>[];
    notFound: Group<{ clientRequestPath: string }>[];
    probes: Group<{ clientRequestPath: string }>[];
  };
  const data = await cfQuery<{ viewer: { zones: Zone[] } }>(env, query, { zone: env.CLOUDFLARE_ZONE_ID, ...lastDay() }, f);
  const zone = data.viewer.zones[0];
  if (!zone) throw new Error("Cloudflare returned no zone for CLOUDFLARE_ZONE_ID");
  const totals = zone.totals[0];
  return {
    requests: totals?.count ?? 0,
    bytes: totals?.sum.edgeResponseBytes ?? 0,
    visits: totals?.sum.visits ?? 0,
    status: statusBuckets(zone.status),
    cache: top(zone.cache, (d) => d.cacheStatus),
    countries: top(zone.countries, (d) => d.clientCountryName),
    notFound: top(zone.notFound, (d) => d.clientRequestPath),
    probes: top(zone.probes, (d) => d.clientRequestPath),
  };
}

async function loadFirewall(env: TelemetryEnv, f: Fetch): Promise<FirewallData> {
  const query = `query Firewall($zone: string, $since: Time, $until: Time) {
    viewer { zones(filter: { zoneTag: $zone }) {
      firewallEventsAdaptiveGroups(limit: 20, filter: { datetime_geq: $since, datetime_lt: $until }, orderBy: [count_DESC]) {
        count dimensions { action source }
      }
    } }
  }`;
  type Zone = { firewallEventsAdaptiveGroups: Group<{ action: string; source: string }>[] };
  const data = await cfQuery<{ viewer: { zones: Zone[] } }>(env, query, { zone: env.CLOUDFLARE_ZONE_ID, ...lastDay() }, f);
  const groups = data.viewer.zones[0]?.firewallEventsAdaptiveGroups ?? [];
  return {
    total: groups.reduce((n, g) => n + g.count, 0),
    actions: top(groups, (d) => `${d.action} · ${d.source}`),
  };
}

async function loadWorker(env: TelemetryEnv, f: Fetch): Promise<WorkerData> {
  const query = `query Worker($account: string, $script: string, $since: Time, $until: Time) {
    viewer { accounts(filter: { accountTag: $account }) {
      workersInvocationsAdaptive(limit: 1, filter: { scriptName: $script, datetime_geq: $since, datetime_leq: $until }) {
        sum { requests errors subrequests }
        quantiles { cpuTimeP50 cpuTimeP99 }
      }
    } }
  }`;
  type Row = { sum: { requests: number; errors: number; subrequests: number }; quantiles: { cpuTimeP50: number; cpuTimeP99: number } };
  const data = await cfQuery<{ viewer: { accounts: { workersInvocationsAdaptive: Row[] }[] } }>(
    env,
    query,
    { account: env.CLOUDFLARE_ACCOUNT_ID, script: WORKER_SCRIPT, ...lastDay() },
    f,
  );
  const row = data.viewer.accounts[0]?.workersInvocationsAdaptive[0];
  // No row means no invocations were recorded for this script name, which is not the same as healthy zeros.
  if (!row) throw new Error(`No invocations recorded for Worker "${WORKER_SCRIPT}" in the last 24 hours`);
  // cpuTime quantiles are in microseconds.
  return {
    requests: row.sum.requests,
    errors: row.sum.errors,
    subrequests: row.sum.subrequests,
    cpuP50Ms: row.quantiles.cpuTimeP50 / 1000,
    cpuP99Ms: row.quantiles.cpuTimeP99 / 1000,
  };
}

// --- D1 ---

async function loadD1(db: D1Database, range: TelemetryRange): Promise<D1Data> {
  const count = async (sql: string) => (await db.prepare(sql).first<{ n: number }>())?.n ?? 0;
  let failures: D1Data["failures"];
  try {
    const { results } = await db
      .prepare("SELECT day, count FROM auth_failures_daily WHERE day > date('now', ?) ORDER BY day")
      .bind(`-${RANGE_DAYS[range]} days`)
      .all<{ day: string; count: number }>();
    failures = results;
  } catch {
    failures = null;
  }
  const [activeSessions, passkeys, posts, projects, roles] = await Promise.all([
    count("SELECT COUNT(*) AS n FROM admin_sessions WHERE expires_at > datetime('now')"),
    count("SELECT COUNT(*) AS n FROM admin_credentials"),
    count("SELECT COUNT(*) AS n FROM blog_posts"),
    count("SELECT COUNT(*) AS n FROM projects"),
    count("SELECT COUNT(*) AS n FROM roles"),
  ]);
  return {
    failures,
    activeSessions,
    passkeys,
    rows: [
      { label: "blog_posts", count: posts },
      { label: "projects", count: projects },
      { label: "roles", count: roles },
    ],
  };
}

export async function collectTelemetry(
  env: TelemetryEnv,
  db: D1Database,
  range: TelemetryRange,
  f: Fetch = fetch,
): Promise<Telemetry> {
  const cf: (keyof TelemetryEnv)[] = ["CLOUDFLARE_ANALYTICS_TOKEN", "CLOUDFLARE_ZONE_ID"];
  const [visits, edge, firewall, worker, d1] = await Promise.all([
    section(env, ["UMAMI_API_TOKEN", "UMAMI_WEBSITE_ID"], () => loadVisits(env, range, f)),
    section(env, cf, () => loadEdge(env, f)),
    section(env, cf, () => loadFirewall(env, f)),
    section(env, ["CLOUDFLARE_ANALYTICS_TOKEN", "CLOUDFLARE_ACCOUNT_ID"], () => loadWorker(env, f)),
    section(env, [], () => loadD1(db, range)),
  ]);
  return { range, generatedAt: new Date().toISOString(), visits, edge, firewall, worker, d1 };
}
