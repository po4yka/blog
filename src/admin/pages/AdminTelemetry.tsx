import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTelemetry } from "@/admin/hooks/useAdminQueries";
import { AdminPageHeader } from "@/admin/components/AdminPageHeader";
import { TELEMETRY_RANGES, type Section, type Top, type TelemetryRange } from "@/lib/telemetry-types";
import type { ActionsSummary } from "@/pages/api/github/actions";

const meta = { fontSize: "max(11px, 0.6875rem)", letterSpacing: "0.04em" } as const;
const fmt = (n: number) => n.toLocaleString("en");
const CACHEABLE = new Set(["hit", "miss", "expired", "revalidated", "updating", "stale"]);

function bytes(n: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function duration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

/** "+12% vs previous" against the comparison period, when there is one. */
function delta(now: number, prev: number | null): string | null {
  if (prev === null || prev === 0) return null;
  const pct = Math.round(((now - prev) / prev) * 100);
  return `${pct > 0 ? "+" : ""}${pct}% vs previous`;
}

function Panel({ label, source, children }: { label: string; source: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="border border-border bg-card" style={{ borderRadius: 2 }}>
      <div className="flex items-baseline justify-between gap-4 px-4 py-2" style={{ borderBottom: "1px solid var(--rule)" }}>
        <h2 className="label-meta">{label}</h2>
        <span className="font-mono text-muted-foreground-dim truncate" style={meta}>
          {source}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Shows a section's data, or says plainly why there is none. */
function SectionBody<T>({ section, hint, children }: { section: Section<T>; hint?: string; children: (data: T) => ReactNode }) {
  if (section.status === "ok") return <>{children(section.data)}</>;
  if (section.status === "unconfigured") {
    return (
      <p className="text-muted-foreground" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
        Not configured. Set the Worker secrets{" "}
        {section.missing.map((m, i) => (
          <span key={m}>
            {i > 0 && ", "}
            <code className="font-mono text-foreground">{m}</code>
          </span>
        ))}
        .
      </p>
    );
  }
  return (
    <div className="space-y-1" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
      <p className="text-foreground">Unavailable.</p>
      <p className="font-mono text-muted-foreground break-words" style={meta}>
        {section.message}
      </p>
      {hint && <p className="text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string | null }) {
  return (
    <div className="min-w-0">
      <div className="label-meta truncate">{label}</div>
      <div className="mt-1 text-foreground" style={{ fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.2 }}>
        {value}
      </div>
      {note && (
        <div className="font-mono text-muted-foreground-dim" style={meta}>
          {note}
        </div>
      )}
    </div>
  );
}

const statGrid = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5";

/** Ranked rows with a hairline bar scaled to the largest count. */
function TopList({ title, rows, empty = "No data in this period." }: { title: string; rows: Top[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="min-w-0">
      <h3 className="label-meta mb-2">{title}</h3>
      {rows.length === 0 ? (
        <p className="font-mono text-muted-foreground-dim" style={meta}>
          {empty}
        </p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="font-mono" style={{ fontSize: "max(11px, 0.75rem)" }}>
              <div className="flex justify-between gap-3">
                <span className="truncate text-foreground" title={r.label}>
                  {r.label}
                </span>
                <span className="shrink-0 text-muted-foreground">{fmt(r.count)}</span>
              </div>
              <div aria-hidden="true" className="mt-0.5 h-px bg-foreground/40" style={{ width: `${(r.count / max) * 100}%` }} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function RangePicker({ value, onChange }: { value: TelemetryRange; onChange: (r: TelemetryRange) => void }) {
  return (
    <div role="group" aria-label="Time range for Umami and D1 panels" className="flex border border-border" style={{ borderRadius: 2 }}>
      {TELEMETRY_RANGES.map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={value === r}
          onClick={() => onChange(r)}
          className={`px-3 py-1.5 font-mono transition-colors duration-100 cursor-pointer ${
            value === r ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
          }`}
          style={meta}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function AdminTelemetry() {
  const [range, setRange] = useState<TelemetryRange>("7d");
  const { data, isLoading, isError, error } = useTelemetry(range);
  // Public endpoint, already cached for 5 minutes on the server.
  const ci = useQuery({
    queryKey: ["admin", "telemetry", "ci"],
    queryFn: async () => {
      const res = await fetch("/api/github/actions");
      if (!res.ok) throw new Error(`GitHub actions returned ${res.status}`);
      return (await res.json()) as ActionsSummary[];
    },
    staleTime: 5 * 60_000,
  });

  const generated = data ? new Date(data.generatedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[1000px]">
      <AdminPageHeader
        number="05"
        label="TELEMETRY"
        meta={generated ? `GENERATED ${generated} · CACHED 5 MIN` : undefined}
        title="Telemetry"
        description="Visits from Umami, edge traffic and Worker health from Cloudflare, sign-in failures from D1."
        actions={<RangePicker value={range} onChange={setRange} />}
      />

      {isLoading && (
        <p className="font-mono text-muted-foreground-dim" style={meta}>
          Loading…
        </p>
      )}
      {isError && (
        <p className="font-mono text-muted-foreground" style={meta}>
          Telemetry could not be loaded: {error instanceof Error ? error.message : "unknown error"}
        </p>
      )}

      {data && (
        <div className="space-y-6">
          <Panel label="VISITS" source={`umami · ${data.range}`}>
            <SectionBody section={data.visits}>
              {(v) => (
                <div className="space-y-6">
                  <div className={statGrid}>
                    <Stat label="PAGEVIEWS" value={fmt(v.pageviews.now)} note={delta(v.pageviews.now, v.pageviews.prev)} />
                    <Stat label="VISITORS" value={fmt(v.visitors.now)} note={delta(v.visitors.now, v.visitors.prev)} />
                    <Stat label="VISITS" value={fmt(v.visits.now)} note={delta(v.visits.now, v.visits.prev)} />
                    <Stat
                      label="BOUNCE RATE"
                      value={v.visits.now ? `${Math.round((v.bounces.now / v.visits.now) * 100)}%` : "–"}
                    />
                    <Stat
                      label="AVG VISIT"
                      value={v.visits.now ? duration(v.totaltimeSec.now / v.visits.now) : "–"}
                      note={v.active !== null ? `${fmt(v.active)} active now` : null}
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <TopList title="PAGES" rows={v.pages} />
                    <TopList title="REFERRERS" rows={v.referrers} />
                    <TopList title="COUNTRIES" rows={v.countries} />
                    <TopList title="EVENTS" rows={v.events} />
                  </div>
                </div>
              )}
            </SectionBody>
          </Panel>

          <Panel label="EDGE TRAFFIC" source="cloudflare · last 24 h · sampled">
            <SectionBody section={data.edge}>
              {(e) => {
                // Worker-rendered responses report "dynamic" or "none"; only cacheable responses go into the ratio.
                const cacheable = e.cache.filter((c) => CACHEABLE.has(c.label));
                const cacheTotal = cacheable.reduce((n, c) => n + c.count, 0);
                const hits = e.cache.find((c) => c.label === "hit")?.count ?? 0;
                const dynamic = e.cache.filter((c) => !CACHEABLE.has(c.label)).reduce((n, c) => n + c.count, 0);
                return (
                  <div className="space-y-6">
                    <div className={statGrid}>
                      <Stat label="REQUESTS" value={`≈ ${fmt(e.requests)}`} />
                      <Stat label="VISITS" value={`≈ ${fmt(e.visits)}`} />
                      <Stat label="BANDWIDTH" value={bytes(e.bytes)} />
                      <Stat
                        label="CACHE HIT"
                        value={cacheTotal ? `${Math.round((hits / cacheTotal) * 100)}%` : "–"}
                        note={`of cacheable · ${fmt(dynamic)} dynamic`}
                      />
                      <Stat
                        label="ERRORS 5XX"
                        value={fmt(e.status["5xx"])}
                        note={`2xx ${fmt(e.status["2xx"])} · 3xx ${fmt(e.status["3xx"])} · 4xx ${fmt(e.status["4xx"])}`}
                      />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <TopList title="COUNTRIES" rows={e.countries} />
                      <TopList title="TOP 404 PATHS" rows={e.notFound} />
                    </div>
                  </div>
                );
              }}
            </SectionBody>
          </Panel>

          <Panel label="SECURITY" source="cloudflare · last 24 h / d1">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                {data.edge.status !== "ok" && <h3 className="label-meta mb-2">PROBE REQUESTS</h3>}
                <SectionBody section={data.edge}>
                  {(e) => (
                    <TopList
                      title={`PROBE REQUESTS · ${fmt(e.probes.reduce((n, p) => n + p.count, 0))}`}
                      rows={e.probes}
                      empty="No requests to known scanner paths."
                    />
                  )}
                </SectionBody>
              </div>
              <div>
                <h3 className="label-meta mb-2">FIREWALL EVENTS</h3>
                <SectionBody
                  section={data.firewall}
                  hint="Cloudflare serves firewall analytics on the Pro plan and higher."
                >
                  {(fw) => <TopList title={`ACTIONS · ${fmt(fw.total)}`} rows={fw.actions} empty="No firewall events." />}
                </SectionBody>
              </div>
              <div className="sm:col-span-2">
                <SectionBody section={data.d1}>
                  {(d) =>
                    d.failures === null ? (
                      <p className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
                        Failed sign-ins are not counted yet: apply <code className="font-mono text-foreground">db/migrations/007_auth_failures_daily.sql</code>.
                      </p>
                    ) : (
                      <TopList
                        title={`FAILED ADMIN SIGN-INS · ${data.range} · UTC DAYS · ${fmt(d.failures.reduce((n, f) => n + f.count, 0))}`}
                        rows={[...d.failures].reverse().map((f) => ({ label: f.day, count: f.count }))}
                        empty="No failed sign-ins in this period."
                      />
                    )
                  }
                </SectionBody>
              </div>
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel label="WORKER" source="po4yka-blog · last 24 h">
              <SectionBody section={data.worker}>
                {(w) => (
                  <div className="grid grid-cols-2 gap-4">
                    <Stat label="INVOCATIONS" value={fmt(w.requests)} />
                    <Stat
                      label="ERRORS"
                      value={fmt(w.errors)}
                      note={w.requests ? `${((w.errors / w.requests) * 100).toFixed(2)}% of invocations` : null}
                    />
                    <Stat label="CPU P50" value={`${w.cpuP50Ms.toFixed(1)} ms`} />
                    <Stat label="CPU P99" value={`${w.cpuP99Ms.toFixed(1)} ms`} />
                  </div>
                )}
              </SectionBody>
            </Panel>

            <Panel label="SYSTEM" source="d1 / github actions">
              <SectionBody section={data.d1}>
                {(d) => (
                  <dl className="font-mono space-y-1.5" style={{ fontSize: "max(11px, 0.75rem)" }}>
                    {[
                      ...d.rows.map((r) => [r.label, fmt(r.count)] as const),
                      ["active sessions", fmt(d.activeSessions)] as const,
                      ["passkeys", fmt(d.passkeys)] as const,
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3" style={{ borderBottom: "1px dashed var(--rule)" }}>
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="text-foreground">{v}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">latest ci</dt>
                      <dd className="text-foreground truncate">
                        {ci.data?.[0] ? (
                          <a href={ci.data[0].url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">
                            #{ci.data[0].runNumber} {ci.data[0].conclusion ?? ci.data[0].status} · {ci.data[0].commit}
                          </a>
                        ) : ci.isLoading ? (
                          "…"
                        ) : (
                          "unavailable"
                        )}
                      </dd>
                    </div>
                  </dl>
                )}
              </SectionBody>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
