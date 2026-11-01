// Data for the admin Telemetry page. Every section comes from a real source
// (self-hosted Umami, the Cloudflare GraphQL Analytics API, D1) and reports
// "unconfigured" or "error" instead of inventing numbers.

import { GITHUB_USERNAME, UMAMI_ORIGIN } from "@/lib/constants";
import { blogPostsMeta } from "@/data/blogMeta";
import { readingMinutes } from "@/lib/reading";
import type {
  CrawlerRow,
  CrawlersData,
  D1Data,
  Deploy,
  EdgeData,
  EdgeTrendData,
  FeedReader,
  FirewallData,
  LighthouseData,
  LighthouseRow,
  OriginsData,
  Pair,
  Point,
  ReadingData,
  Section,
  Telemetry,
  TelemetryRange,
  Top,
  VisitTrendData,
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

/** Umami API calls for one website and time range. */
function umami(env: TelemetryEnv, range: TelemetryRange, f: Fetch) {
  const endAt = Date.now();
  const startAt = endAt - RANGE_DAYS[range] * 86_400_000;
  const base = `${UMAMI_ORIGIN}/api/websites/${encodeURIComponent(env.UMAMI_WEBSITE_ID!)}`;
  const window = `startAt=${startAt}&endAt=${endAt}`;
  const request = (path: string) =>
    f(`${base}${path}`, { headers: { Authorization: `Bearer ${env.UMAMI_API_TOKEN}`, Accept: "application/json" } });
  const get = async (path: string): Promise<unknown> => {
    const res = await request(path);
    if (!res.ok) throw new Error(`Umami ${path.split("?")[0] || "/"} returned ${res.status}`);
    return res.json();
  };
  /** Tries each metric type name in turn while Umami answers 400 (an unsupported type). */
  const metric = async (limit: number, ...types: string[]): Promise<Top[]> => {
    for (const [i, type] of types.entries()) {
      const res = await request(`/metrics?${window}&type=${type}&limit=${limit}`);
      if (res.status === 400 && i < types.length - 1) continue;
      if (!res.ok) throw new Error(`Umami /metrics?type=${type} returned ${res.status}`);
      const rows: unknown = await res.json();
      if (!Array.isArray(rows)) throw new Error(`Umami /metrics?type=${type} did not return a list`);
      return (rows as { x: string | null; y: number }[]).slice(0, limit).map((r) => ({ label: r.x || "(none)", count: r.y }));
    }
    return [];
  };
  // Current Umami calls the page dimension "path"; Umami 2.x calls it "url" and rejects "path" with 400.
  const pages = (limit: number) => metric(limit, "path", "url");
  return { window, get, metric, pages };
}

async function loadVisits(env: TelemetryEnv, range: TelemetryRange, f: Fetch): Promise<VisitsData> {
  const { window, get, metric, pages: pageMetric } = umami(env, range, f);
  const [stats, active, pages, referrers, countries, events] = await Promise.all([
    get(`/stats?${window}&compare=prev`) as Promise<Record<string, unknown>>,
    get("/active").catch(() => null) as Promise<{ visitors?: number; x?: number } | null>,
    pageMetric(8),
    metric(8, "referrer"),
    metric(8, "country"),
    metric(8, "event"),
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

// --- Time series helpers ---

type Unit = "hour" | "day";

/** Start of the UTC hour or day that contains `ms`, as an ISO string. */
function bucketStart(ms: number, unit: Unit): string {
  const d = new Date(ms);
  if (unit === "day") d.setUTCHours(0, 0, 0, 0);
  else d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

/** Parse an API time: Umami sends "2026-11-01 13:00:00" (UTC when asked), Cloudflare ISO. */
function parseTime(t: string): number {
  const iso = t.includes("T") ? t : `${t.replace(" ", "T")}Z`;
  return Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
}

/** One point per hour or day from `fromMs` to now, zero where the source had no row. */
export function fillSeries(rows: { t: string; value: number }[], fromMs: number, unit: Unit, nowMs = Date.now()): Point[] {
  const byBucket = new Map<string, number>();
  for (const r of rows) {
    const ms = parseTime(r.t);
    if (Number.isNaN(ms)) continue;
    const key = bucketStart(ms, unit);
    byBucket.set(key, (byBucket.get(key) ?? 0) + r.value);
  }
  const step = unit === "day" ? 86_400_000 : 3_600_000;
  const out: Point[] = [];
  for (let ms = Date.parse(bucketStart(fromMs, unit)); ms <= nowMs; ms += step) {
    const t = new Date(ms).toISOString();
    out.push({ t, value: byBucket.get(t) ?? 0 });
  }
  return out;
}

// --- Reading (Umami) ---

const READING_PATH_LIMIT = 500;

const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

async function loadReading(env: TelemetryEnv, range: TelemetryRange, f: Fetch): Promise<ReadingData> {
  const { window, get, pages } = umami(env, range, f);
  const [paths, completions] = await Promise.all([
    // shortcut: the 500 most viewed paths; a post outside them shows 0 views. The panel states the limit.
    pages(READING_PATH_LIMIT),
    // Umami 2.x reads eventName, current Umami also accepts the event filter.
    get(`/event-data/values?${window}&event=blog-read-complete&eventName=blog-read-complete&propertyName=slug`),
  ]);
  if (!Array.isArray(completions)) throw new Error("Umami /event-data/values did not return a list");

  const views = new Map<string, number>();
  for (const p of paths) views.set(trimSlash(p.label), (views.get(trimSlash(p.label)) ?? 0) + p.count);
  const done = new Map<string, number>();
  for (const c of completions as { value: string; total: number }[]) done.set(c.value, (done.get(c.value) ?? 0) + c.total);

  const bySlug = new Map<string, (typeof blogPostsMeta)[number]>();
  for (const m of blogPostsMeta) if (!bySlug.has(m.slug) || m.lang === "en") bySlug.set(m.slug, m);
  const posts = [...bySlug.values()].map((m) => ({
    slug: m.slug,
    title: m.title,
    pageviews: (views.get(`/blog/${m.slug}`) ?? 0) + (views.get(`/blog/ru/${m.slug}`) ?? 0),
    completions: done.get(m.slug) ?? 0,
    words: m.wordCount ?? null,
    readingMin: readingMinutes(m),
    href: m.lang === "ru" ? `/blog/ru/${m.slug}/` : `/blog/${m.slug}/`,
  }));
  posts.sort((a, b) => b.pageviews - a.pageviews || a.title.localeCompare(b.title));
  return { posts, pathLimit: READING_PATH_LIMIT };
}

// --- Trends ---

async function loadVisitTrend(env: TelemetryEnv, range: TelemetryRange, f: Fetch): Promise<VisitTrendData> {
  const unit: Unit = range === "24h" ? "hour" : "day";
  const { window, get } = umami(env, range, f);
  const body = (await get(`/pageviews?${window}&unit=${unit}&timezone=UTC`)) as {
    pageviews?: { x: string; y: number }[];
    sessions?: { x: string; y: number }[];
  };
  if (!Array.isArray(body.pageviews)) throw new Error("Umami /pageviews did not return a series");
  const from = Date.now() - RANGE_DAYS[range] * 86_400_000;
  const series = (rows: { x: string; y: number }[]) => fillSeries(rows.map((r) => ({ t: r.x, value: r.y })), from, unit);
  // A missing session series is shown as no overlay, never as a line of zeros.
  return { unit, pageviews: series(body.pageviews), sessions: Array.isArray(body.sessions) ? series(body.sessions) : null };
}

async function loadEdgeTrend(env: TelemetryEnv, f: Fetch): Promise<EdgeTrendData> {
  const query = `query EdgeTrend($zone: string, $since: Time, $until: Time) {
    viewer { zones(filter: { zoneTag: $zone }) {
      requests: httpRequestsAdaptiveGroups(limit: 48, filter: { datetime_geq: $since, datetime_lt: $until, requestSource: "eyeball" }, orderBy: [datetimeHour_ASC]) {
        count dimensions { datetimeHour }
      }
      errors: httpRequestsAdaptiveGroups(limit: 48, filter: { datetime_geq: $since, datetime_lt: $until, requestSource: "eyeball", edgeResponseStatus_geq: 500 }, orderBy: [datetimeHour_ASC]) {
        count dimensions { datetimeHour }
      }
    } }
  }`;
  type Hourly = Group<{ datetimeHour: string }>[];
  const window = lastDay();
  const data = await cfQuery<{ viewer: { zones: { requests: Hourly; errors: Hourly }[] } }>(env, query, { zone: env.CLOUDFLARE_ZONE_ID, ...window }, f);
  const zone = data.viewer.zones[0];
  if (!zone) throw new Error("Cloudflare returned no zone for CLOUDFLARE_ZONE_ID");
  const from = Date.parse(window.since);
  const series = (g: Hourly) => fillSeries(g.map((r) => ({ t: r.dimensions.datetimeHour, value: r.count })), from, "hour");
  return { requests: series(zone.requests), errors5xx: series(zone.errors) };
}

/** Deploys the deploy job recorded after `wrangler deploy` succeeded (table from migration 008). */
async function loadDeploys(db: D1Database, range: TelemetryRange): Promise<Deploy[]> {
  type Row = { commit_sha: string; deployed_at: string };
  try {
    const { results } = await db
      .prepare("SELECT commit_sha, deployed_at FROM deploys WHERE deployed_at > datetime('now', ?) ORDER BY deployed_at")
      .bind(`-${RANGE_DAYS[range]} days`)
      .all<Row>();
    return results.map((r: Row) => ({
      at: r.deployed_at,
      commit: r.commit_sha.slice(0, 7),
      url: `https://github.com/${GITHUB_USERNAME}/blog/commit/${r.commit_sha}`,
    }));
  } catch (err) {
    // Until the first deploy after migration 008 creates the table, there are no markers to show.
    if (err instanceof Error && /no such table/i.test(err.message)) return [];
    throw err;
  }
}

// --- Machine readers (Cloudflare) ---

/** Files written for crawlers, agents and feed readers (post .md copies are matched separately). */
export const MACHINE_PATHS = ["/llms.txt", "/llms-full.txt", "/robots.txt", "/rss.xml", "/rss.ru.xml", "/sitemap-index.xml", "/sitemap-0.xml"];

const AGENTS: [RegExp, string, CrawlerRow["kind"]][] = [
  [/GPTBot/i, "GPTBot", "ai"],
  [/OAI-SearchBot/i, "OAI-SearchBot", "ai"],
  [/ChatGPT-User/i, "ChatGPT-User", "ai"],
  [/ClaudeBot/i, "ClaudeBot", "ai"],
  [/Claude-SearchBot/i, "Claude-SearchBot", "ai"],
  [/Claude-User/i, "Claude-User", "ai"],
  [/PerplexityBot/i, "PerplexityBot", "ai"],
  [/Perplexity-User/i, "Perplexity-User", "ai"],
  [/meta-externalagent/i, "Meta-ExternalAgent", "ai"],
  [/Amazonbot/i, "Amazonbot", "ai"],
  [/Bytespider/i, "Bytespider", "ai"],
  [/CCBot/i, "CCBot", "ai"],
  [/DuckAssistBot/i, "DuckAssistBot", "ai"],
  [/MistralAI-User/i, "MistralAI-User", "ai"],
  [/cohere-ai/i, "cohere-ai", "ai"],
  [/Googlebot/i, "Googlebot", "search"],
  [/bingbot/i, "Bingbot", "search"],
  [/Applebot/i, "Applebot", "search"],
  [/YandexBot/i, "YandexBot", "search"],
  [/DuckDuckBot/i, "DuckDuckBot", "search"],
  [/Feedly/i, "Feedly", "feed"],
  [/Inoreader/i, "Inoreader", "feed"],
  [/NewsBlur/i, "NewsBlur", "feed"],
  [/Feedbin/i, "Feedbin", "feed"],
  [/Miniflux/i, "Miniflux", "feed"],
  [/NetNewsWire/i, "NetNewsWire", "feed"],
  [/FreshRSS/i, "FreshRSS", "feed"],
  [/Old ?Reader/i, "The Old Reader", "feed"],
];

/** Name and kind of a user agent; anything unknown is grouped as "Other agents". */
export function classifyAgent(ua: string): { name: string; kind: CrawlerRow["kind"] } {
  for (const [re, name, kind] of AGENTS) if (re.test(ua)) return { name, kind };
  // Feed services that are not listed still announce "N subscribers".
  if (/\d+\s+subscribers?/i.test(ua)) {
    // The product token, unless it is the generic "Mozilla/5.0" prefix many readers send.
    const token = ua.split(/[/ (;]/)[0] ?? "";
    return { name: token && !/^mozilla$/i.test(token) ? token : "Feed reader", kind: "feed" };
  }
  return { name: "Other agents", kind: "other" };
}

/** Subscriber count a feed reader reports in its user agent, for example "Feedly/1.0 (...; 42 subscribers)". */
export function reportedSubscribers(ua: string): number | null {
  const m = /(\d+)\s+subscribers?/i.exec(ua);
  return m ? Number(m[1]) : null;
}

const CRAWLER_GROUP_LIMIT = 1000;

async function loadCrawlers(env: TelemetryEnv, f: Fetch): Promise<CrawlersData> {
  const query = `query Crawlers($zone: string, $since: Time, $until: Time) {
    viewer { zones(filter: { zoneTag: $zone }) {
      httpRequestsAdaptiveGroups(limit: ${CRAWLER_GROUP_LIMIT}, orderBy: [count_DESC], filter: {
        datetime_geq: $since, datetime_lt: $until,
        OR: [{ clientRequestPath_in: ${JSON.stringify(MACHINE_PATHS)} }, { clientRequestPath_like: "%.md" }]
      }) { count dimensions { clientRequestPath userAgent } }
    } }
  }`;
  type Zone = { httpRequestsAdaptiveGroups: Group<{ clientRequestPath: string; userAgent: string }>[] };
  const data = await cfQuery<{ viewer: { zones: Zone[] } }>(env, query, { zone: env.CLOUDFLARE_ZONE_ID, ...lastDay() }, f);
  const groups = data.viewer.zones[0]?.httpRequestsAdaptiveGroups ?? [];

  const rows = new Map<string, { kind: CrawlerRow["kind"]; requests: number; paths: Map<string, number> }>();
  const readers = new Map<string, FeedReader>();
  let total = 0;
  for (const g of groups) {
    const { clientRequestPath: path, userAgent: ua } = g.dimensions;
    total += g.count;
    const { name, kind } = classifyAgent(ua ?? "");
    const row = rows.get(name) ?? { kind, requests: 0, paths: new Map() };
    row.requests += g.count;
    // Post .md copies are grouped, so one crawler does not list every post.
    const label = path.endsWith(".md") ? "/blog/*.md" : path;
    row.paths.set(label, (row.paths.get(label) ?? 0) + g.count);
    rows.set(name, row);
    const subs = reportedSubscribers(ua ?? "");
    if (subs !== null && /\.xml$/.test(path)) {
      const key = `${name} ${path}`;
      // The count is a total the reader reports on every fetch: keep the largest seen, never add.
      if ((readers.get(key)?.subscribers ?? -1) < subs) readers.set(key, { name, feed: path, subscribers: subs });
    }
  }
  const crawlers = [...rows.entries()]
    .map(([name, r]) => ({
      name,
      kind: r.kind,
      requests: r.requests,
      paths: [...r.paths.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 4),
    }))
    .sort((a, b) => (a.kind === "other" ? 1 : 0) - (b.kind === "other" ? 1 : 0) || b.requests - a.requests);
  return {
    total,
    crawlers,
    feedReaders: [...readers.values()].sort((a, b) => b.subscribers - a.subscribers),
    truncated: groups.length >= CRAWLER_GROUP_LIMIT,
  };
}

// --- Attack origins (Cloudflare) ---

async function loadOrigins(env: TelemetryEnv, f: Fetch): Promise<OriginsData> {
  const base = `datetime_geq: $since, datetime_lt: $until, requestSource: "eyeball"`;
  const query = `query Origins($zone: string, $since: Time, $until: Time) {
    viewer { zones(filter: { zoneTag: $zone }) {
      networks: httpRequestsAdaptiveGroups(limit: 10, orderBy: [count_DESC], filter: { ${base}, edgeResponseStatus_geq: 400, edgeResponseStatus_lt: 500 }) {
        count dimensions { clientAsn clientASNDescription }
      }
      probeCountries: httpRequestsAdaptiveGroups(limit: 10, orderBy: [count_DESC], filter: { ${base}, clientRequestPath_in: ${JSON.stringify(PROBE_PATHS)} }) {
        count dimensions { clientCountryName }
      }
    } }
  }`;
  type Zone = {
    networks: Group<{ clientAsn: string | number; clientASNDescription: string }>[];
    probeCountries: Group<{ clientCountryName: string }>[];
  };
  const data = await cfQuery<{ viewer: { zones: Zone[] } }>(env, query, { zone: env.CLOUDFLARE_ZONE_ID, ...lastDay() }, f);
  const zone = data.viewer.zones[0];
  if (!zone) throw new Error("Cloudflare returned no zone for CLOUDFLARE_ZONE_ID");
  return {
    networks: zone.networks.map((g) => ({
      asn: Number(g.dimensions.clientAsn),
      name: g.dimensions.clientASNDescription || "(unknown network)",
      requests: g.count,
    })),
    probeCountries: top(zone.probeCountries, (d) => d.clientCountryName),
  };
}

// --- Lighthouse (D1, written by the deploy job) ---

async function loadLighthouse(db: D1Database): Promise<LighthouseData> {
  type Row = {
    commit_sha: string;
    measured_at: string;
    form_factor: "desktop" | "mobile";
    path: string;
    performance: number | null;
    accessibility: number | null;
    best_practices: number | null;
    lcp_ms: number | null;
    cls: number | null;
    tbt_ms: number | null;
  };
  type HistoryRow = { commit_sha: string; measured_at: string; form_factor: "desktop" | "mobile"; performance: number };
  try {
    const last = await db
      .prepare("SELECT commit_sha, measured_at FROM lighthouse_runs ORDER BY measured_at DESC LIMIT 1")
      .first<{ commit_sha: string; measured_at: string }>();
    if (!last) return { latest: null, history: [] };
    const [{ results: rows }, { results: history }] = await Promise.all([
      db.prepare("SELECT * FROM lighthouse_runs WHERE commit_sha = ? ORDER BY form_factor, path").bind(last.commit_sha).all<Row>(),
      db
        .prepare(
          `SELECT * FROM (
             SELECT commit_sha, MAX(measured_at) AS measured_at, form_factor, AVG(performance) AS performance
             FROM lighthouse_runs WHERE performance IS NOT NULL
             GROUP BY commit_sha, form_factor ORDER BY measured_at DESC LIMIT 60
           ) ORDER BY measured_at ASC`,
        )
        .all<HistoryRow>(),
    ]);
    const toRow = (r: Row): LighthouseRow => ({
      formFactor: r.form_factor,
      path: r.path,
      performance: r.performance,
      accessibility: r.accessibility,
      bestPractices: r.best_practices,
      lcpMs: r.lcp_ms,
      cls: r.cls,
      tbtMs: r.tbt_ms,
    });
    return {
      latest: { commit: last.commit_sha.slice(0, 7), measuredAt: last.measured_at, rows: rows.map(toRow) },
      history: history.map((h: HistoryRow) => ({
        commit: h.commit_sha.slice(0, 7),
        measuredAt: h.measured_at,
        formFactor: h.form_factor,
        performance: h.performance,
      })),
    };
  } catch (err) {
    if (err instanceof Error && /no such table/i.test(err.message)) return { latest: null, history: [] };
    throw err;
  }
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
  const um: (keyof TelemetryEnv)[] = ["UMAMI_API_TOKEN", "UMAMI_WEBSITE_ID"];
  const [visits, edge, firewall, worker, d1, reading, visitTrend, edgeTrend, deploys, crawlers, origins, lighthouse] =
    await Promise.all([
      section(env, um, () => loadVisits(env, range, f)),
      section(env, cf, () => loadEdge(env, f)),
      section(env, cf, () => loadFirewall(env, f)),
      section(env, ["CLOUDFLARE_ANALYTICS_TOKEN", "CLOUDFLARE_ACCOUNT_ID"], () => loadWorker(env, f)),
      section(env, [], () => loadD1(db, range)),
      section(env, um, () => loadReading(env, range, f)),
      section(env, um, () => loadVisitTrend(env, range, f)),
      section(env, cf, () => loadEdgeTrend(env, f)),
      section(env, [], () => loadDeploys(db, range)),
      section(env, cf, () => loadCrawlers(env, f)),
      section(env, cf, () => loadOrigins(env, f)),
      section(env, [], () => loadLighthouse(db)),
    ]);
  return {
    range,
    generatedAt: new Date().toISOString(),
    visits,
    edge,
    firewall,
    worker,
    d1,
    reading,
    visitTrend,
    edgeTrend,
    deploys,
    crawlers,
    origins,
    lighthouse,
  };
}
