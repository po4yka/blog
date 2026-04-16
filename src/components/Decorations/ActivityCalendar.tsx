import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell } from "./_helpers";
import { ease } from "@/lib/motion";

const WEEKS = 13; // ~3 months
const DAYS_PER_WEEK = 7;
const TOTAL_DAYS = WEEKS * DAYS_PER_WEEK;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface DayCell {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
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
  // Start from (TOTAL_DAYS - 1) days ago, ending today
  // Align to start on a Sunday (day 0)
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = endDate.getDay(); // 0=Sun
  const startOffset = TOTAL_DAYS - 1 + (DAYS_PER_WEEK - 1 - dayOfWeek);

  for (let i = startOffset; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = counts.get(key) ?? 0;
    cells.push({ date: key, count, level: 0 });
  }

  // Trim to exact grid size (WEEKS * 7)
  const trimmed = cells.slice(cells.length - TOTAL_DAYS);

  // Compute levels based on max
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

const LEVEL_COLORS = [
  "var(--border)",
  "color-mix(in srgb, var(--accent) 20%, transparent)",
  "color-mix(in srgb, var(--accent) 40%, transparent)",
  "color-mix(in srgb, var(--accent) 65%, transparent)",
  "var(--accent)",
];

export function ActivityCalendar({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [events, setEvents] = useState<Array<{ created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/github/calendar`)
      .then((r) => r.json())
      .catch(() => [])
      .then((data) => {
        // The events endpoint returns a summary, but we need raw events
        // Fall back to fetching public events directly for the calendar
        if (Array.isArray(data)) {
          setEvents(data);
        }
        setLoading(false);
      });
  }, []);

  const cells = useMemo(() => buildCalendar(events), [events]);
  const totalContributions = cells.reduce((sum, c) => sum + c.count, 0);

  // Group into columns (weeks)
  const weeks: DayCell[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(cells.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK));
  }

  // Month labels for top row
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

  if (loading) return null;

  return (
    <MotionProvider>
      <PanelShell
        label="ACTIVITY"
        labelRight={`${totalContributions} events · ${WEEKS} weeks`}
        delay={delay}
      >
        <div ref={ref} className="px-5 py-3">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1 ml-[28px]">
            {Array.from({ length: WEEKS }).map((_, w) => {
              const label = monthLabels.find((m) => m.col === w);
              return (
                <span
                  key={w}
                  className="text-muted-foreground/30 text-center"
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
                  className="text-muted-foreground/25"
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
                  {week.map((day, d) => (
                    <motion.div
                      key={day.date}
                      className="rounded-[2px]"
                      style={{
                        width: 11,
                        height: 11,
                        backgroundColor: LEVEL_COLORS[day.level],
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={inView ? { opacity: 1, scale: 1 } : {}}
                      transition={{
                        duration: 0.15,
                        delay: delay + 0.05 + (w * 7 + d) * 0.002,
                        ease,
                      }}
                      title={`${day.date}: ${day.count} events`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-2">
            <span className="text-muted-foreground/25" style={{ fontSize: "8px" }}>Less</span>
            {LEVEL_COLORS.map((color, i) => (
              <div
                key={i}
                className="rounded-[2px]"
                style={{ width: 9, height: 9, backgroundColor: color }}
              />
            ))}
            <span className="text-muted-foreground/25" style={{ fontSize: "8px" }}>More</span>
          </div>
        </div>
      </PanelShell>
    </MotionProvider>
  );
}
