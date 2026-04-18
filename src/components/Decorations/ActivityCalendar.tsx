import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell } from "./_helpers";
import { easeStep8 } from "@/lib/motion";

const WEEKS = 13; // ~3 months
const DAYS_PER_WEEK = 7;
const TOTAL_DAYS = WEEKS * DAYS_PER_WEEK;
const ACTIVE_WINDOW = 91; // 13 weeks * 7 days
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

interface DayCell {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  label: string;   // "MAR 14"
  ariaLabel: string; // "Mar 14 — 8 events"
}

function buildCalendar(events: Array<{ created_at: string }>): DayCell[] {
  const now = new Date();
  const counts = new Map<string, number>();

  for (const event of events) {
    const d = new Date(event.created_at);
    const key = d.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const cells: DayCell[] = [];
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = endDate.getDay();
  const startOffset = TOTAL_DAYS - 1 + (DAYS_PER_WEEK - 1 - dayOfWeek);

  for (let i = startOffset; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = counts.get(key) ?? 0;
    const mon = MONTHS[d.getMonth()]!;
    const label = `${mon} ${d.getDate()}`;
    const ariaLabel = `${mon.charAt(0)}${mon.slice(1).toLowerCase()} ${d.getDate()} — ${count} event${count === 1 ? "" : "s"}`;
    cells.push({ date: key, count, level: 0, label, ariaLabel });
  }

  const trimmed = cells.slice(cells.length - TOTAL_DAYS);

  const max = Math.max(1, ...trimmed.map((c) => c.count));
  for (const cell of trimmed) {
    if (cell.count === 0) cell.level = 0;
    else if (cell.count <= max * 0.25) cell.level = 1;
    else if (cell.count <= max * 0.5) cell.level = 2;
    else if (cell.count <= max * 0.75) cell.level = 3;
    else cell.level = 4;
  }

  return trimmed;
}

// Grayscale ramp using foreground/muted-foreground tokens
const LEVEL_COLORS = [
  "var(--border)",
  "color-mix(in srgb, var(--muted-foreground) 20%, transparent)",
  "color-mix(in srgb, var(--muted-foreground) 40%, transparent)",
  "color-mix(in srgb, var(--foreground) 50%, transparent)",
  "var(--foreground)",
];

export function ActivityCalendar({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [events, setEvents] = useState<Array<{ created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/github/calendar`)
      .then((r) => r.json())
      .catch(() => [])
      .then((data) => {
        if (Array.isArray(data)) {
          setEvents(data);
        }
        setLoading(false);
      });
  }, []);

  const cells = useMemo(() => buildCalendar(events), [events]);

  const totalEvents = cells.reduce((sum, c) => sum + c.count, 0);
  const activeDays = cells.filter((c) => c.count > 0).length;

  const weeks: DayCell[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(cells.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK));
  }

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let lastMonth = -1;
    for (let w = 0; w < weeks.length; w++) {
      const firstDay = weeks[w]?.[0];
      if (!firstDay) continue;
      const m = new Date(firstDay.date).getMonth();
      if (m !== lastMonth) {
        labels.push({ col: w, label: months[m]! });
        lastMonth = m;
      }
    }
    return labels;
  }, [weeks]);

  const hoveredCell = hoveredIdx !== null ? cells[hoveredIdx] ?? null : null;

  const baselineLabel = `${totalEvents} EVENT${totalEvents === 1 ? "" : "S"} · ${activeDays}/${ACTIVE_WINDOW} ACTIVE`;
  const hoverLabel = hoveredCell && hoveredCell.count > 0
    ? `${hoveredCell.label} · ${hoveredCell.count} EVENT${hoveredCell.count === 1 ? "" : "S"}`
    : null;

  if (loading) return null;

  return (
    <MotionProvider>
      <PanelShell
        label="ACTIVITY"
        labelRight={`${WEEKS} weeks`}
        delay={delay}
      >
        <div ref={ref} className="px-5 py-3">
          {/* Hover overlay / baseline strip */}
          <div
            className="relative"
            style={{ minHeight: 14, marginBottom: 4 }}
            aria-live="polite"
          >
            {hoverLabel ? (
              <span
                className="absolute left-0 right-0 select-none"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: "var(--foreground)",
                  opacity: 0.9,
                  lineHeight: 1,
                }}
              >
                {hoverLabel}
              </span>
            ) : (
              <span
                className="absolute left-0 right-0 text-muted-foreground-dim select-none"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  lineHeight: 1,
                }}
              >
                {baselineLabel}
              </span>
            )}
          </div>

          {/* Month labels */}
          <div className="flex gap-[3px] mb-1 ml-[28px]">
            {Array.from({ length: WEEKS }).map((_, w) => {
              const label = monthLabels.find((m) => m.col === w);
              return (
                <span
                  key={w}
                  className="text-muted-foreground text-center"
                  style={{ width: 11, fontSize: "8px" }}
                >
                  {label?.label ?? ""}
                </span>
              );
            })}
          </div>

          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1.5 shrink-0">
              {DAY_LABELS.map((label, i) => (
                <span
                  key={i}
                  className="text-muted-foreground-dim"
                  style={{ height: 11, lineHeight: "11px", fontSize: "8px", width: 20, textAlign: "right" }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, w) => (
                <div key={w} className="flex flex-col gap-[3px]">
                  {week.map((day, d) => {
                    const cellIdx = w * DAYS_PER_WEEK + d;
                    return (
                      <motion.div
                        key={day.date}
                        className="rounded-[2px] cursor-default"
                        style={{
                          width: 11,
                          height: 11,
                          backgroundColor: LEVEL_COLORS[day.level],
                        }}
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : {}}
                        transition={{
                          duration: 0.15,
                          delay: delay + 0.05 + (w * 7 + d) * 0.002,
                          ease: easeStep8,
                        }}
                        title={`${day.date}: ${day.count} event${day.count === 1 ? "" : "s"}`}
                        aria-label={day.ariaLabel}
                        onMouseEnter={() => setHoveredIdx(cellIdx)}
                        onMouseLeave={() => setHoveredIdx((cur) => (cur === cellIdx ? null : cur))}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className="text-muted-foreground-dim"
              style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              less
            </span>
            {LEVEL_COLORS.map((color, i) => (
              <div
                key={i}
                className="rounded-[2px]"
                style={{ width: 11, height: 11, backgroundColor: color, flexShrink: 0 }}
              />
            ))}
            <span
              className="text-muted-foreground-dim"
              style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              more
            </span>
          </div>
        </div>
      </PanelShell>
    </MotionProvider>
  );
}
