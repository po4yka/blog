import { GITHUB_USERNAME } from "@/lib/constants";
import { useState, useEffect, type KeyboardEvent, type PointerEvent } from "react";
import { EVENT_FORMS, shortDay } from "@/lib/activity";
import { useLocale } from "@/stores/settingsStore";
import { pluralize } from "@/lib/plural";
import type { TranslationKey } from "@/lib/i18n";
import { PanelShell } from "./_helpers";
import { deferIdle } from "./_utils";
import type { GitHubActivitySummary } from "@/types";

const BUCKETS = 14;
const W = (BUCKETS - 1) * 10;
const H = 32;

function formatSinceLatest(latestIso: string | null, t: (key: TranslationKey) => string): string | null {
  if (!latestIso) return null;
  const diffMs = Date.now() - new Date(latestIso).getTime();
  if (diffMs < 0) return null;
  const mins = Math.floor(diffMs / 60_000);
  const hrs = Math.floor(mins / 60);
  const [n, unit] =
    mins < 60 ? [mins, "activity.unitMin"] as const
    : hrs < 24 ? [hrs, "activity.unitHour"] as const
    : [Math.floor(hrs / 24), "activity.unitDay"] as const;
  return `${n}${t(unit)} ${t("activity.ago")}`;
}

export function ActivitySparkline({ delay = 0 }: { delay?: number }) {
  const { locale, t } = useLocale();
  const up = (key: TranslationKey) => t(key).toLocaleUpperCase(locale);
  const plural = (n: number) => pluralize(n, locale, EVENT_FORMS).toLocaleUpperCase(locale);
  const [announce, setAnnounce] = useState("");
  const [data, setData] = useState<GitHubActivitySummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    // Defer decorative fetch off the critical path so it does not race LCP.
    return deferIdle(() => {
      fetch("/api/github/events")
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((d: GitHubActivitySummary) => {
          if (!Array.isArray(d?.buckets) || d.buckets.length !== BUCKETS) throw new Error("unexpected payload");
          setData(d);
          setStatus("ready");
        })
        .catch(() => setStatus("unavailable"));
    });
  }, []);

  // Dates exist only after data arrives, so the server HTML and the first client render match.
  const buckets = data?.buckets ?? [];
  const labels = buckets.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (BUCKETS - 1 - i));
    return shortDay(d, locale);
  });
  const max = Math.max(...buckets, 1);
  // sqrt scaling so single-event days stay visible vs. zero.
  const ys = buckets.map((c) => H - 2 - Math.sqrt(c / max) * (H - 4));
  const path = ys.map((y, i) => `${i === 0 ? "M" : "L"}${i * 10} ${y.toFixed(1)}`).join(" ");
  const latest = buckets[BUCKETS - 1] ?? 0;

  const total = data?.total ?? 0;
  const sinceLatest = formatSinceLatest(data?.latest ?? null, t)?.toLocaleUpperCase(locale) ?? null;
  const bucketText = (i: number) => `${labels[i]} · ${plural(buckets[i]!)}`;
  const readout =
    active !== null && data
      ? bucketText(active)
      : data
        ? `${up("activity.peak")} ${max} · ${up("activity.avg")} ${Math.round(total / BUCKETS)}${up("activity.perDay")}${sinceLatest ? ` · ${up("activity.last")} ${sinceLatest}` : ""}`
        : up(status === "loading" ? "activity.loading" : "activity.unavailable");

  const onKeyDown = (e: KeyboardEvent) => {
    if (!data) return;
    const cur = active ?? BUCKETS - 1;
    const next =
      e.key === "ArrowLeft" ? cur - 1
      : e.key === "ArrowRight" ? cur + 1
      : e.key === "Home" ? 0
      : e.key === "End" ? BUCKETS - 1
      : null;
    if (next === null) return;
    e.preventDefault();
    const clamped = Math.min(BUCKETS - 1, Math.max(0, next));
    setActive(clamped);
    // Only keyboard moves are announced; pointer moves just update the visible readout.
    setAnnounce(bucketText(clamped));
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!data) return;
    const box = e.currentTarget.getBoundingClientRect();
    setActive(Math.min(BUCKETS - 1, Math.max(0, Math.round(((e.clientX - box.left) / box.width) * (BUCKETS - 1)))));
  };

  return (
    <PanelShell
      label="activity"
      labelRight={
        <a
          href={`https://github.com/${GITHUB_USERNAME}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground-dim hover:text-foreground transition-colors duration-150"
        >
          → GH
        </a>
      }
      delay={delay}
    >
      <div className="px-5 py-3">
        <p
          className="text-label select-none truncate"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em", minHeight: 14, lineHeight: "14px" }}
        >
          <span className={active !== null ? "text-foreground/90" : "text-muted-foreground-dim"}>{readout}</span>
        </p>

        <div
          tabIndex={data ? 0 : -1}
          role="group"
          aria-label={t("activity.sparkLabel").replace("{n}", String(BUCKETS))}
          aria-keyshortcuts="ArrowLeft ArrowRight Home End"
          className="relative mt-2"
          style={{ height: H }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (!data) return;
            // Focus lands on today and announces it, so keyboard reading starts from a known day.
            const start = active ?? BUCKETS - 1;
            setActive(start);
            setAnnounce(bucketText(start));
          }}
          onBlur={() => {
            setActive(null);
            setAnnounce("");
          }}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
        >
          <svg aria-hidden="true" width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block overflow-visible">
            <line x1={0} y1={H - 2} x2={W} y2={H - 2} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
            {data && (
              <path
                d={path}
                fill="none"
                stroke="var(--foreground)"
                strokeWidth={1.5}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="rule-draw"
              />
            )}
          </svg>
          {data && (
            <span
              aria-hidden="true"
              className="absolute size-[5px] -translate-1/2 bg-foreground"
              style={{ left: "100%", top: `${(ys[BUCKETS - 1]! / H) * 100}%` }}
            />
          )}
          {active !== null && (
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-0 w-px bg-foreground/40 pointer-events-none"
              style={{ left: `${(active / (BUCKETS - 1)) * 100}%` }}
            />
          )}
        </div>

        <div
          className="flex justify-between mt-1 text-muted-foreground-dim select-none"
          style={{ fontFamily: "var(--font-mono)", fontSize: "max(11px, 0.6875rem)", lineHeight: 1, minHeight: 11 }}
          aria-hidden="true"
        >
          <span>{labels[0] ?? " "}</span>
          {data && <span className="text-foreground/80">{up("activity.today")} {latest}</span>}
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announce}
        </p>

        {data && (
          <div className="sr-only">
            <table>
              <caption>{t("activity.sparkCaption").replace("{n}", String(BUCKETS))}</caption>
              <thead>
                <tr><th scope="col">{t("activity.day")}</th><th scope="col">{t("activity.events")}</th></tr>
              </thead>
              <tbody>
                {buckets.map((count, i) => (
                  <tr key={i}><th scope="row">{labels[i]}</th><td>{count}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PanelShell>
  );
}
