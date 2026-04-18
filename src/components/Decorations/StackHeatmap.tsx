import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell } from "./_helpers";
import { roles } from "@/data/experienceData";
import { buildMeta } from "@/data/buildMeta";

/**
 * Career stack heatmap — real data, no seeded RNG.
 *
 * Derives a (top-N tags) × (months-of-career) grid from experienceData.
 * A cell is "active" if the tag was listed on any role whose period
 * overlapped that month. Row order = total active months (descending) so
 * the dominant stack lives at the top.
 *
 * "Present" resolves against buildMeta.deployDate (baked at build time) so
 * SSR and client first-render agree, avoiding hydration drift.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const TOP_N = 10;

type YM = { year: number; month: number };

function parseMonth(s: string): YM | null {
  const m = /^([A-Z][a-z]{2})\s+(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const idx = MONTHS.indexOf(m[1]!);
  if (idx < 0) return null;
  return { year: Number(m[2]!), month: idx };
}

function monthIndex(ym: YM, origin: YM): number {
  return (ym.year - origin.year) * 12 + (ym.month - origin.month);
}

interface HeatmapData {
  tags: string[];
  monthLabels: YM[];
  grid: boolean[][];
  totalTagCount: number;
  totalMonths: number;
}

function buildStackHeatmap(): HeatmapData {
  const deploy = new Date(buildMeta.deployDate);
  const nowYM: YM = { year: deploy.getUTCFullYear(), month: deploy.getUTCMonth() };

  type ParsedRole = { tags: string[]; start: YM; end: YM };
  const parsed: ParsedRole[] = [];

  for (const r of roles) {
    const parts = r.period.split(/[—–-]/).map((p) => p.trim());
    if (parts.length !== 2) continue;
    const start = parseMonth(parts[0]!);
    if (!start) continue;
    const end = parts[1]!.toLowerCase().includes("present")
      ? nowYM
      : parseMonth(parts[1]!);
    if (!end) continue;
    parsed.push({ tags: r.tags ?? [], start, end });
  }

  if (parsed.length === 0) {
    return { tags: [], monthLabels: [], grid: [], totalTagCount: 0, totalMonths: 0 };
  }

  const origin = parsed.reduce(
    (acc, p) =>
      p.start.year * 12 + p.start.month < acc.year * 12 + acc.month ? p.start : acc,
    parsed[0]!.start,
  );
  const latest = parsed.reduce(
    (acc, p) =>
      p.end.year * 12 + p.end.month > acc.year * 12 + acc.month ? p.end : acc,
    parsed[0]!.end,
  );

  const totalMonths =
    (latest.year - origin.year) * 12 + (latest.month - origin.month) + 1;

  const tagMap = new Map<string, boolean[]>();
  for (const p of parsed) {
    const sIdx = monthIndex(p.start, origin);
    const eIdx = monthIndex(p.end, origin);
    for (const tag of p.tags) {
      let arr = tagMap.get(tag);
      if (!arr) {
        arr = new Array<boolean>(totalMonths).fill(false);
        tagMap.set(tag, arr);
      }
      for (let i = Math.max(0, sIdx); i <= Math.min(totalMonths - 1, eIdx); i++) {
        arr[i] = true;
      }
    }
  }

  const totalTagCount = tagMap.size;
  const ranked = [...tagMap.entries()]
    .map(([tag, arr]) => ({
      tag,
      arr,
      months: arr.reduce((n, v) => n + (v ? 1 : 0), 0),
    }))
    .sort((a, b) => b.months - a.months || a.tag.localeCompare(b.tag))
    .slice(0, TOP_N);

  const tags = ranked.map((r) => r.tag);
  const grid = ranked.map((r) => r.arr);

  const monthLabels: YM[] = [];
  for (let i = 0; i < totalMonths; i++) {
    const y = origin.year + Math.floor((origin.month + i) / 12);
    const m = ((origin.month + i) % 12 + 12) % 12;
    monthLabels.push({ year: y, month: m });
  }

  return { tags, monthLabels, grid, totalTagCount, totalMonths };
}

export function StackHeatmap({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null);
  const data = useMemo(() => buildStackHeatmap(), []);

  if (data.tags.length === 0) return null;

  const yearTicks = data.monthLabels
    .map((ml, i) => ({ ml, i }))
    .filter(({ ml }) => ml.month === 0);

  return (
    <MotionProvider>
      <PanelShell
        label="stack history"
        labelRight={`${data.tags.length}/${data.totalTagCount} tags · ${data.totalMonths} mo`}
        delay={delay}
      >
        <div ref={ref} className="px-5 py-4 relative">
          <div className="flex gap-3">
            <div
              className="flex flex-col gap-[3px] shrink-0"
              style={{ width: 92 }}
            >
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-muted-foreground-dim text-right truncate"
                  style={{
                    height: 10,
                    fontSize: 9,
                    lineHeight: "10px",
                    letterSpacing: "0.04em",
                    fontFamily: "var(--font-mono)",
                  }}
                  title={tag}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-[3px] flex-1 min-w-0">
              {data.grid.map((row, r) => (
                <div key={r} className="flex gap-[3px]">
                  {row.map((active, c) => {
                    const isHovered =
                      hovered?.r === r && hovered?.c === c;
                    const inHoverRow = hovered?.r === r;
                    const inHoverCol = hovered?.c === c;
                    const opacity = active
                      ? isHovered
                        ? 1
                        : inHoverRow || inHoverCol
                          ? 0.9
                          : 0.75
                      : isHovered
                        ? 0.25
                        : inHoverRow || inHoverCol
                          ? 0.15
                          : 0.06;
                    const ml = data.monthLabels[c]!;
                    return (
                      <motion.span
                        key={c}
                        className="inline-block cursor-crosshair rounded-[2px] flex-1"
                        style={{
                          height: 10,
                          minWidth: 4,
                          maxWidth: 14,
                          backgroundColor: active
                            ? "var(--foreground)"
                            : "var(--muted-foreground-dim)",
                          opacity,
                          transition: "opacity 0.15s ease",
                        }}
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity } : {}}
                        transition={{
                          duration: 0.15,
                          delay: delay + 0.04 + c * 0.004 + r * 0.012,
                        }}
                        onMouseEnter={() => setHovered({ r, c })}
                        onMouseLeave={() => setHovered(null)}
                        title={`${data.tags[r]} · ${MONTHS[ml.month]} ${ml.year} · ${active ? "active" : "—"}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <div style={{ width: 92 }} />
            <div
              className="flex-1 min-w-0 relative"
              style={{ height: 14 }}
            >
              {yearTicks.map(({ ml, i }) => {
                const pct = (i / Math.max(1, data.totalMonths - 1)) * 100;
                return (
                  <span
                    key={ml.year}
                    className="absolute text-muted-foreground-dim"
                    style={{
                      left: `${pct}%`,
                      transform: "translateX(-50%)",
                      fontSize: 9,
                      lineHeight: "14px",
                      letterSpacing: "0.06em",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {ml.year}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <div style={{ width: 92 }} />
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span
                className="inline-block rounded-[2px] shrink-0"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: "var(--foreground)",
                  opacity: 0.75,
                }}
              />
              <span
                className="text-muted-foreground-dim"
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginLeft: 2,
                }}
              >
                ACTIVE
              </span>
              <span
                className="inline-block rounded-[2px] shrink-0"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: "var(--muted-foreground-dim)",
                  opacity: 0.06,
                  marginLeft: 4,
                }}
              />
              <span
                className="text-muted-foreground-dim"
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginLeft: 2,
                }}
              >
                IDLE
              </span>
            </div>
          </div>

          {hovered && (
            <div
              className="absolute top-2 right-5 text-muted-foreground text-xs font-mono"
              style={{ letterSpacing: "0.04em" }}
            >
              {data.tags[hovered.r]} ·{" "}
              {MONTHS[data.monthLabels[hovered.c]!.month]}{" "}
              {data.monthLabels[hovered.c]!.year}
            </div>
          )}
        </div>
      </PanelShell>
    </MotionProvider>
  );
}
