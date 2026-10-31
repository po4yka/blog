import { useState, useEffect, useMemo, type CSSProperties, type KeyboardEvent } from "react";
import { PanelShell } from "./_helpers";
import { buildCalendar, DAYS_PER_WEEK, TOTAL_DAYS, WEEKS } from "@/lib/activity";

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// SVG geometry, in px (the SVG renders at 1:1).
const CELL = 16;
const PITCH = CELL + 3;
const LABEL_W = 28;
const HEAD_H = 16;
const SVG_W = LABEL_W + WEEKS * PITCH - 3;
const SVG_H = HEAD_H + DAYS_PER_WEEK * PITCH - 3;

// Grayscale ramp using foreground/muted-foreground tokens
const LEVEL_COLORS = [
  "var(--border)",
  "color-mix(in srgb, var(--muted-foreground) 20%, transparent)",
  "color-mix(in srgb, var(--muted-foreground) 40%, transparent)",
  "color-mix(in srgb, var(--foreground) 50%, transparent)",
  "var(--foreground)",
];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "S"}`;

export function ActivityCalendar({ delay = 0 }: { delay?: number }) {
  const [events, setEvents] = useState<Array<{ created_at: string }>>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/github/calendar`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: unknown) => {
        if (!Array.isArray(data)) throw new Error("unexpected payload");
        setEvents(data);
        setStatus("ready");
      })
      .catch(() => setStatus("unavailable"));
  }, []);
  // Until data arrives the panel renders its full frame with an empty grid and
  // nothing date-based, so the server HTML (built earlier) and the first client
  // render match, and the height never changes.
  const ready = status === "ready";

  const cells = useMemo(() => (ready ? buildCalendar(events) : []), [ready, events]);
  const lastPast = cells.findLastIndex((c) => !c.future);
  const totalEvents = cells.reduce((sum, c) => sum + c.count, 0);
  const activeDays = cells.filter((c) => c.count > 0).length;

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = "";
    for (let w = 0; w < WEEKS; w++) {
      const month = cells[w * DAYS_PER_WEEK]?.label.split(" ")[0];
      if (!month || month === lastMonth) continue;
      // A label needs three columns; drop a partial month that would collide.
      const prev = labels[labels.length - 1];
      if (prev && w - prev.col < 3) labels.pop();
      labels.push({ col: w, label: month });
      lastMonth = month;
    }
    return labels;
  }, [cells]);

  const activeCell = active !== null ? cells[active] : undefined;
  const readout = activeCell
    ? `${activeCell.label} · ${plural(activeCell.count, "EVENT")}`
    : ready
      ? `${plural(totalEvents, "EVENT")} · ${activeDays}/${lastPast + 1} DAYS ACTIVE`
      : status === "loading"
        ? "LOADING"
        : "ACTIVITY UNAVAILABLE";

  // Arrow keys move a cursor over the grid: left/right by week, up/down by day.
  const onKeyDown = (e: KeyboardEvent) => {
    if (!ready) return;
    const step: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    const cur = active ?? lastPast;
    let next: number;
    if (e.key in step) next = cur + step[e.key]!;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = lastPast;
    else return;
    e.preventDefault();
    setActive(Math.min(lastPast, Math.max(0, next)));
  };

  const pos = (i: number) => ({
    x: LABEL_W + Math.floor(i / DAYS_PER_WEEK) * PITCH,
    y: HEAD_H + (i % DAYS_PER_WEEK) * PITCH,
  });

  return (
    <PanelShell label="ACTIVITY" labelRight="public GitHub events" delay={delay}>
      <div className="px-5 py-3">
        <p
          className="text-label select-none mb-2 truncate"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em", minHeight: 14, lineHeight: "14px" }}
          aria-live="polite"
        >
          <span className={activeCell ? "text-foreground/90" : "text-muted-foreground-dim"}>{readout}</span>
        </p>

        <div
          tabIndex={ready ? 0 : -1}
          role="group"
          aria-label={`Activity calendar, last ${WEEKS} weeks. Arrow keys read one day at a time.`}
          aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End"
          className="w-fit max-w-full overflow-x-auto"
          onKeyDown={onKeyDown}
          onFocus={() => ready && setActive((cur) => cur ?? lastPast)}
          onBlur={() => setActive(null)}
          onMouseLeave={() => setActive(null)}
        >
          <svg
            aria-hidden="true"
            width={SVG_W}
            height={SVG_H}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="block text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
          >
            {monthLabels.map(({ col, label }) => (
              <text key={col} x={LABEL_W + col * PITCH} y={11} fill="currentColor">
                {label.charAt(0) + label.slice(1).toLowerCase()}
              </text>
            ))}
            {DAY_LABELS.map((label, d) =>
              label ? (
                <text key={d} x={LABEL_W - 6} y={HEAD_H + d * PITCH + 12} textAnchor="end" fill="currentColor" opacity={0.7}>
                  {label}
                </text>
              ) : null,
            )}
            {ready
              ? cells.map((day, i) =>
                  day.future ? null : (
                    <rect
                      key={day.date}
                      {...pos(i)}
                      width={CELL}
                      height={CELL}
                      rx={2}
                      fill={LEVEL_COLORS[day.level]}
                      className="cell-in"
                      style={{ "--col": Math.floor(i / DAYS_PER_WEEK) } as CSSProperties}
                      onMouseEnter={() => setActive(i)}
                    />
                  ),
                )
              : Array.from({ length: TOTAL_DAYS }, (_, i) => (
                  <rect key={i} {...pos(i)} width={CELL} height={CELL} rx={2} fill={LEVEL_COLORS[0]} />
                ))}
            {active !== null && (
              <rect
                x={pos(active).x - 2}
                y={pos(active).y - 2}
                width={CELL + 4}
                height={CELL + 4}
                rx={3}
                fill="none"
                stroke="var(--foreground)"
                strokeWidth={1.5}
                pointerEvents="none"
              />
            )}
          </svg>
        </div>

        {ready && (
          <div className="sr-only">
            <table>
              <caption>Public GitHub events per day, last {WEEKS} weeks (the API returns the latest 100 events)</caption>
              <thead>
                <tr>
                  <th scope="col">Week of</th>
                  {WEEKDAYS.map((d) => <th key={d} scope="col">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: WEEKS }, (_, w) => {
                  const week = cells.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK);
                  return (
                    <tr key={w}>
                      <th scope="row">{week[0]!.date}</th>
                      {week.map((day) => <td key={day.date}>{day.future ? "" : day.count}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2" aria-hidden="true">
          <span className="text-muted-foreground-dim label-meta">less</span>
          {LEVEL_COLORS.map((color, i) => (
            <div key={i} className="rounded-[2px] shrink-0" style={{ width: 11, height: 11, backgroundColor: color }} />
          ))}
          <span className="text-muted-foreground-dim label-meta">more</span>
        </div>
      </div>
    </PanelShell>
  );
}
