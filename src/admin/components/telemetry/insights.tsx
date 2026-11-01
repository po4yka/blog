import type { CrawlersData, LighthouseData, OriginsData, ReadingData, Section } from "@/lib/telemetry-types";
import { fmt, meta, mono, pct, timeMs } from "./format";
import { Panel, SectionBody, Sparkline, TopList } from "./parts";

const th = "px-2 py-1.5 font-normal text-left text-muted-foreground-dim";
const td = "px-2 py-1.5";
const row = { borderTop: "1px dashed var(--rule)" } as const;

export function ReadingPanel({ section, range }: { section: Section<ReadingData>; range: string }) {
  return (
    <Panel label="READING" source={`umami · ${range} · both languages`}>
      <SectionBody section={section}>
        {({ posts, pathLimit }) => (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full font-mono" style={mono}>
              <caption className="sr-only">Pageviews and finished reads per post</caption>
              <thead>
                <tr style={meta}>
                  <th scope="col" className={th}>POST</th>
                  <th scope="col" className={`${th} text-right`}>VIEWS</th>
                  <th scope="col" className={`${th} text-right`}>FINISHED</th>
                  <th scope="col" className={`${th} text-right`}>RATE</th>
                  <th scope="col" className={`${th} text-right`}>LENGTH</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.slug} style={row}>
                    <th scope="row" className={`${td} text-left font-normal max-w-[22rem]`}>
                      <a href={p.href} target="_blank" rel="noopener noreferrer" className="block truncate font-sans text-foreground hover:underline underline-offset-4" title={p.title}>
                        {p.title}
                      </a>
                    </th>
                    <td className={`${td} text-right text-foreground`}>{fmt(p.pageviews)}</td>
                    <td className={`${td} text-right text-foreground`}>{fmt(p.completions)}</td>
                    <td className={`${td} text-right text-foreground`}>
                      {p.pageviews > 0 ? `${Math.round((p.completions / p.pageviews) * 100)}%` : "–"}
                    </td>
                    <td className={`${td} text-right text-muted-foreground whitespace-nowrap`}>
                      {p.words === null ? "–" : `${fmt(p.words)} w`} · {p.readingMin === null ? "–" : `${p.readingMin} min`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 px-2 text-muted-foreground" style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
              Finished counts the <code className="font-mono">blog-read-complete</code> event, sent once per page load when the end of the post is fully on screen. Views come from the {fmt(pathLimit)} most viewed paths, and the two are counted separately, so the rate is approximate and can pass 100%.
            </p>
          </div>
        )}
      </SectionBody>
    </Panel>
  );
}

const KIND_LABEL = { ai: "AI", search: "search", feed: "feed", other: "other" } as const;

export function CrawlersPanel({ section }: { section: Section<CrawlersData> }) {
  return (
    <Panel label="MACHINE READERS" source="cloudflare · last 24 h · sampled">
      <SectionBody section={section}>
        {(c) => (
          <div className="space-y-6">
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
              ≈ {fmt(c.total)} requests to <code className="font-mono">llms.txt</code>, <code className="font-mono">llms-full.txt</code>, <code className="font-mono">robots.txt</code>, sitemaps, RSS and post <code className="font-mono">.md</code> files, grouped by the user agent each client claims (not verified).
              {c.truncated && " Only the most frequent path and agent pairs are counted, so the totals are low."}
            </p>
            {c.crawlers.length === 0 ? (
              <p className="font-mono text-muted-foreground-dim" style={meta}>No requests in the last 24 hours.</p>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full font-mono" style={mono}>
                  <caption className="sr-only">Requests to machine-readable files per user agent</caption>
                  <thead>
                    <tr style={meta}>
                      <th scope="col" className={th}>AGENT</th>
                      <th scope="col" className={th}>KIND</th>
                      <th scope="col" className={`${th} text-right`}>REQUESTS</th>
                      <th scope="col" className={th}>FILES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.crawlers.map((r) => (
                      <tr key={r.name} style={row}>
                        <th scope="row" className={`${td} text-left font-normal text-foreground whitespace-nowrap`}>{r.name}</th>
                        <td className={`${td} text-muted-foreground`}>{KIND_LABEL[r.kind]}</td>
                        <td className={`${td} text-right text-foreground`}>{fmt(r.requests)}</td>
                        <td className={`${td} text-muted-foreground`}>
                          {r.paths.map((p) => `${p.label} ${fmt(p.count)}`).join(" · ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div>
              <h3 className="label-meta mb-2">FEED SUBSCRIBERS (REPORTED BY THE READER)</h3>
              {c.feedReaders.length === 0 ? (
                <p className="font-mono text-muted-foreground-dim" style={meta}>No feed reader reported a subscriber count.</p>
              ) : (
                <ul className="font-mono space-y-1" style={mono}>
                  {c.feedReaders.map((r) => (
                    <li key={`${r.name} ${r.feed}`} className="flex justify-between gap-3" style={row}>
                      <span className="text-foreground">{r.name} <span className="text-muted-foreground">{r.feed}</span></span>
                      <span className="text-foreground">{fmt(r.subscribers)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </SectionBody>
    </Panel>
  );
}

/** Networks and countries behind 4xx and scanner requests; rendered inside the Security panel. */
export function OriginsBlock({ section }: { section: Section<OriginsData> }) {
  return (
    <div>
      {section.status !== "ok" && <h3 className="label-meta mb-2">ORIGINS</h3>}
      <SectionBody section={section}>
        {(o) => (
          <div className="grid gap-6 sm:grid-cols-2">
            <TopList
              title="4XX RESPONSES BY NETWORK · 24 H"
              rows={o.networks.map((n) => ({ label: `AS${n.asn} ${n.name}`, count: n.requests }))}
              empty="No 4xx responses."
            />
            <TopList title="PROBES BY COUNTRY · 24 H" rows={o.probeCountries} empty="No requests to scanner paths." />
          </div>
        )}
      </SectionBody>
    </div>
  );
}

const ms = (n: number | null) => (n === null ? "–" : n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`);

export function PageSpeedPanel({ section }: { section: Section<LighthouseData> }) {
  return (
    <Panel label="PAGE SPEED" source="lighthouse ci · per deploy · lab data">
      <SectionBody section={section}>
        {(lh) =>
          lh.latest === null ? (
            <p className="text-muted-foreground" style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>
              No Lighthouse results yet. The deploy job stores them after the next push to <code className="font-mono text-foreground">main</code>.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto -mx-2">
                <table className="w-full font-mono" style={mono}>
                  <caption className="px-2 pb-2 text-left font-mono text-muted-foreground-dim" style={meta}>
                    DEPLOY {lh.latest.commit} · {lh.latest.measuredAt.slice(0, 16)} UTC · SCORES 0–100
                  </caption>
                  <thead>
                    <tr style={meta}>
                      <th scope="col" className={th}>PAGE</th>
                      <th scope="col" className={th}>DEVICE</th>
                      <th scope="col" className={`${th} text-right`}>PERF</th>
                      <th scope="col" className={`${th} text-right`}>A11Y</th>
                      <th scope="col" className={`${th} text-right`}>BEST PR.</th>
                      <th scope="col" className={`${th} text-right`}>LCP</th>
                      <th scope="col" className={`${th} text-right`}>CLS</th>
                      <th scope="col" className={`${th} text-right`}>TBT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lh.latest.rows.map((r) => (
                      <tr key={`${r.formFactor} ${r.path}`} style={row}>
                        <th scope="row" className={`${td} text-left font-normal text-foreground`}>{r.path}</th>
                        <td className={`${td} text-muted-foreground`}>{r.formFactor}</td>
                        <td className={`${td} text-right text-foreground`}>{pct(r.performance)}</td>
                        <td className={`${td} text-right text-foreground`}>{pct(r.accessibility)}</td>
                        <td className={`${td} text-right text-foreground`}>{pct(r.bestPractices)}</td>
                        <td className={`${td} text-right text-foreground`}>{ms(r.lcpMs)}</td>
                        <td className={`${td} text-right text-foreground`}>{r.cls === null ? "–" : r.cls.toFixed(3)}</td>
                        <td className={`${td} text-right text-foreground`}>{ms(r.tbtMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {lh.history.length > 1 && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {(["desktop", "mobile"] as const).map((form) => {
                    const points = lh.history
                      .filter((h) => h.formFactor === form)
                      .map((h) => ({ t: new Date(timeMs(h.measuredAt)).toISOString(), value: Math.round(h.performance * 100) }));
                    return (
                      <Sparkline
                        key={form}
                        title={`PERFORMANCE · ${form.toUpperCase()} · AVG PER DEPLOY`}
                        points={points}
                        unit="day"
                        kind="score"
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )
        }
      </SectionBody>
    </Panel>
  );
}
