import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useInView } from "@/hooks/useInView";
import { MotionProvider } from "@/components/MotionProvider";
import { easeStep8 } from "@/lib/motion";
import { PanelShell } from "./_helpers";
import { deferIdle } from "./_utils";
import type { GitHubActivitySummary } from "@/types";

const GH_USER = "po4yka";
const BUCKETS = 14;
const BAR_MAX_PX = 36;

interface BucketMeta {
  count: number;
  date: Date;
  label: string; // "MAR 14"
  ariaLabel: string; // "Mar 14 — 8 events"
}

function formatShortDay(d: Date): string {
  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function formatSinceLatest(latestIso: string | null): string | null {
  if (!latestIso) return null;
  const diffMs = Date.now() - new Date(latestIso).getTime();
  if (diffMs < 0) return null;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h AGO`;
  const days = Math.floor(hrs / 24);
  return `${days}d AGO`;
}

function SparkBar({
  count,
  normalizedHeight,
  delay,
  inView,
  label,
  ariaLabel,
  isFirst,
  isLast,
  onHover,
  onLeave,
}: {
  count: number;
  normalizedHeight: number;
  delay: number;
  inView: boolean;
  label: string;
  ariaLabel: string;
  isFirst: boolean;
  isLast: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const hasEvents = count > 0;
  const opacity = hasEvents ? 0.32 + (normalizedHeight / BAR_MAX_PX) * 0.5 : 0.18;

  return (
    <div
      className="relative flex flex-col items-center cursor-default"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      tabIndex={hasEvents ? 0 : -1}
      role={hasEvents ? "img" : undefined}
      aria-label={hasEvents ? ariaLabel : undefined}
    >
      <div className="flex items-end" style={{ width: "14px", height: `${BAR_MAX_PX}px` }}>
        <motion.div
          style={{
            width: "10px",
            borderRadius: "2px 2px 0 0",
            backgroundColor: hasEvents ? "var(--foreground)" : "var(--border)",
            opacity,
            minHeight: "2px",
          }}
          initial={{ height: 0 }}
          animate={inView ? { height: `${Math.max(2, normalizedHeight)}px` } : { height: 0 }}
          transition={{ duration: 0.4, delay, ease: easeStep8 }}
        />
      </div>
      {(isFirst || isLast) && (
        <span
          aria-hidden="true"
          className="text-muted-foreground-dim select-none"
          style={{ fontFamily: "var(--font-mono)", fontSize: 9, lineHeight: 1, marginTop: 3 }}
        >
          {label.split(" ")[1]}
        </span>
      )}
    </div>
  );
}

export function ActivitySparkline({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [data, setData] = useState<GitHubActivitySummary | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    // Defer decorative fetch off the critical path so it does not race LCP.
    return deferIdle(() => {
      fetch("/api/github/events")
        .then((r) => r.json())
        .then((d: GitHubActivitySummary) => setData(d))
        .catch(() => {});
    });
  }, []);

  const buckets = data?.buckets ?? Array<number>(BUCKETS).fill(0);
  const maxBucket = Math.max(...buckets, 1);

  // Build dated bucket metadata. bucket[0] is oldest, bucket[N-1] is today.
  const bucketMeta: BucketMeta[] = buckets.map((count, i) => {
    const daysAgo = BUCKETS - 1 - i;
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const label = formatShortDay(d);
    return {
      count,
      date: d,
      label,
      ariaLabel: `${label.charAt(0)}${label.slice(1).toLowerCase()} — ${count} event${count === 1 ? "" : "s"}`,
    };
  });

  // sqrt scaling so single-event days stay visible vs. zero.
  const normalizedHeights = buckets.map((count) =>
    count === 0 ? 0 : Math.max(3, Math.sqrt(count / maxBucket) * BAR_MAX_PX),
  );

  const peak = maxBucket;
  const total = data?.total ?? 0;
  const avg = data ? Math.round(total / BUCKETS) : 0;
  const sinceLatest = formatSinceLatest(data?.latest ?? null);

  const hoveredMeta = hoverIdx !== null ? bucketMeta[hoverIdx] : null;

  return (
    <MotionProvider>
      <PanelShell
        label="activity"
        labelRight={
          <a
            href={`https://github.com/${GH_USER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground-dim hover:text-foreground transition-colors duration-150"
          >
            → GH
          </a>
        }
        delay={delay}
      >
        <div ref={ref} className="px-5 py-4">
          {/* Tooltip overlay — anchored above bar row, revealed on hover */}
          <div
            className="relative"
            style={{ minHeight: 14 }}
            aria-live="polite"
          >
            {hoveredMeta && hoveredMeta.count > 0 ? (
              <span
                className="absolute left-0 right-0 text-label text-foreground/90 select-none"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
              >
                {hoveredMeta.label} · {hoveredMeta.count} EVENT
                {hoveredMeta.count === 1 ? "" : "S"}
              </span>
            ) : data ? (
              <span className="absolute left-0 right-0 text-label text-muted-foreground-dim select-none">
                PEAK {peak} · AVG {avg}/D
                {sinceLatest ? ` · LAST ${sinceLatest}` : ""}
              </span>
            ) : null}
          </div>

          <div className="flex items-end justify-between mt-2" style={{ gap: 2 }}>
            {normalizedHeights.map((h, i) => {
              const meta = bucketMeta[i]!;
              return (
                <SparkBar
                  key={i}
                  count={meta.count}
                  normalizedHeight={h}
                  delay={delay + 0.1 + i * 0.03}
                  inView={inView}
                  label={meta.label}
                  ariaLabel={meta.ariaLabel}
                  isFirst={i === 0}
                  isLast={i === BUCKETS - 1}
                  onHover={() => setHoverIdx(i)}
                  onLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
                />
              );
            })}
          </div>
        </div>
      </PanelShell>
    </MotionProvider>
  );
}
