import type { ReactNode } from "react";
import type { Point, Section, Top } from "@/lib/telemetry-types";
import { fmt, meta, mono, shortTime, timeMs } from "./format";

export function Panel({ label, source, children }: { label: string; source: string; children: ReactNode }) {
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
export function SectionBody<T>({ section, hint, children }: { section: Section<T>; hint?: string; children: (data: T) => ReactNode }) {
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

export function Stat({ label, value, note }: { label: string; value: string; note?: string | null }) {
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

/** Ranked rows with a hairline bar scaled to the largest count. */
export function TopList({ title, rows, empty = "No data in this period." }: { title: string; rows: Top[]; empty?: string }) {
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
            <li key={r.label} className="font-mono" style={mono}>
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

const W = 600;
const H = 56;

/**
 * Line chart of one series over time, an optional dashed second series on the same scale, and
 * short ticks on the bottom edge (deploys, which can be dozens per range). Points are placed by
 * time, so gaps and irregular runs read correctly.
 */
export function Sparkline({
  title,
  points,
  unit,
  overlay,
  markers = [],
  kind = "count",
}: {
  title: string;
  points: Point[];
  unit: "hour" | "day";
  overlay?: { label: string; points: Point[] };
  markers?: { at: string; label: string }[];
  /** "count" sums the points (requests); "score" is a 0-100 value per point (Lighthouse), never summed. */
  kind?: "count" | "score";
}) {
  if (points.length < 2) {
    // One point has no line to draw: show its value as text.
    return (
      <div className="min-w-0">
        <div className="label-meta mb-1">{title}</div>
        <p className="font-mono text-muted-foreground-dim" style={meta}>
          {points.length === 0 ? "No data in this period." : `${fmt(points[0]!.value)} at ${shortTime(points[0]!.t, unit)} · one point so far`}
        </p>
      </div>
    );
  }
  const t0 = timeMs(points[0]!.t);
  const t1 = Math.max(t0 + 1, timeMs(points[points.length - 1]!.t));
  const max = kind === "score" ? 100 : Math.max(1, ...points.map((p) => p.value), ...(overlay?.points.map((p) => p.value) ?? []));
  const x = (t: string) => ((timeMs(t) - t0) / (t1 - t0)) * W;
  const y = (v: number) => H - 2 - (v / max) * (H - 4);
  const line = (ps: Point[]) => ps.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const total = points.reduce((n, p) => n + p.value, 0);
  const peak = points.reduce((a, b) => (b.value > a.value ? b : a));
  const low = points.reduce((a, b) => (b.value < a.value ? b : a));
  const summary =
    kind === "score"
      ? `latest ${points[points.length - 1]!.value} · lowest ${low.value} at ${shortTime(low.t, unit)}`
      : `total ${fmt(total)} · peak ${fmt(peak.value)} at ${shortTime(peak.t, unit)}`;
  const inRange = markers.filter((m) => timeMs(m.at) >= t0 && timeMs(m.at) <= t1);

  return (
    <figure className="min-w-0">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
        <span className="label-meta">{title}</span>
        <span className="font-mono text-muted-foreground-dim" style={meta}>
          {summary}
          {overlay && ` · dashed: ${overlay.label}`}
          {inRange.length > 0 && ` · ticks: ${inRange.length} ${inRange.length === 1 ? "deploy" : "deploys"}`}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height: H }}
        role="img"
        aria-label={`${title}: ${summary}`}
      >
        {inRange.map((m, i) => (
          <line
            key={`${m.at}-${i}`}
            x1={x(m.at)}
            x2={x(m.at)}
            y1={H - 8}
            y2={H}
            stroke="var(--muted-foreground)"
            vectorEffect="non-scaling-stroke"
          >
            <title>{m.label}</title>
          </line>
        ))}
        <path d={line(points)} fill="none" stroke="var(--foreground)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {overlay && (
          <path
            d={line(overlay.points)}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth={1}
            strokeDasharray="3 2"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <div className="flex justify-between font-mono text-muted-foreground-dim" style={meta}>
        <span>{shortTime(points[0]!.t, unit)}</span>
        <span>{shortTime(points[points.length - 1]!.t, unit)}</span>
      </div>
    </figure>
  );
}
