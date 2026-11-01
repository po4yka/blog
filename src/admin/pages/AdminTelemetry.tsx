import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTelemetry } from "@/admin/hooks/useAdminQueries";
import { AdminPageHeader } from "@/admin/components/AdminPageHeader";
import { TELEMETRY_RANGES, type TelemetryRange } from "@/lib/telemetry-types";
import type { ActionsSummary } from "@/pages/api/github/actions";
import { bytes, delta, duration, fmt, meta, statGrid } from "@/admin/components/telemetry/format";
import { Panel, SectionBody, Sparkline, Stat, TopList } from "@/admin/components/telemetry/parts";
import { CrawlersPanel, OriginsBlock, PageSpeedPanel, ReadingPanel } from "@/admin/components/telemetry/insights";

const CACHEABLE = new Set(["hit", "miss", "expired", "revalidated", "updating", "stale"]);

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

  const markers =
    data?.deploys.status === "ok" ? data.deploys.data.map((d) => ({ at: d.at, label: `deploy ${d.commit}` })) : [];
  const generated = data ? new Date(data.generatedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 max-w-[1000px]">
      <AdminPageHeader
        number="05"
        label="TELEMETRY"
        meta={generated ? `GENERATED ${generated} · CACHED 5 MIN` : undefined}
        title="Telemetry"
        description="Visits and reading from Umami, traffic, crawlers and Worker health from Cloudflare, page speed and sign-in failures from D1."
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
                  <SectionBody section={data.visitTrend}>
                    {(tr) => (
                      <Sparkline
                        title={`PAGEVIEWS PER ${tr.unit.toUpperCase()}`}
                        points={tr.pageviews}
                        overlay={tr.sessions ? { label: "sessions", points: tr.sessions } : undefined}
                        unit={tr.unit}
                        markers={markers}
                      />
                    )}
                  </SectionBody>
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

          <ReadingPanel section={data.reading} range={data.range} />

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
                    <SectionBody section={data.edgeTrend}>
                      {(tr) => (
                        <Sparkline
                          title="REQUESTS PER HOUR"
                          points={tr.requests}
                          overlay={{ label: "5xx", points: tr.errors5xx }}
                          unit="hour"
                          markers={markers}
                        />
                      )}
                    </SectionBody>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <TopList title="COUNTRIES" rows={e.countries} />
                      <TopList title="TOP 404 PATHS" rows={e.notFound} />
                    </div>
                  </div>
                );
              }}
            </SectionBody>
          </Panel>

          <CrawlersPanel section={data.crawlers} />

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
                <OriginsBlock section={data.origins} />
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

          <PageSpeedPanel section={data.lighthouse} />

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
