import { useState, useEffect } from "react";
import { PanelShell } from "./_helpers";
import { deferIdle } from "./_utils";
import { useLocale } from "@/stores/settingsStore";
import type { Locale } from "@/lib/i18n";
import type { GitHubLatestRelease } from "@/types";

function relativeTime(iso: string, locale: Locale): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "narrow" });
  return days < 30 ? rtf.format(-days, "day") : rtf.format(-Math.floor(days / 30), "month");
}

function formatAbsolute(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

/** Split a semver-ish tag "v2.3.1" into muted prefix + foreground body. */
function TagDisplay({ tag }: { tag: string }) {
  const match = tag.match(/^(v)(.+)$/i);
  if (!match) return <span data-decode className="text-foreground/90">{tag}</span>;
  return (
    <>
      <span className="text-muted-foreground-dim">{match[1]}</span>
      <span data-decode className="text-foreground/90">{match[2]}</span>
    </>
  );
}

type ReleaseState =
  | { status: "loading" | "none" | "unavailable" }
  | { status: "ready"; release: GitHubLatestRelease };

// Fixed body height (three rows plus padding) so the hero strip never shifts.
const BODY_CLASS = "px-5 py-3 min-h-24";

const STATUS_KEY = {
  loading: "release.loading",
  none: "release.none",
  unavailable: "release.unavailable",
} as const;

export function LatestReleasePanel({ delay = 0 }: { delay?: number }) {
  const { t, locale } = useLocale();
  const [state, setState] = useState<ReleaseState>({ status: "loading" });

  useEffect(() => {
    // Defer decorative fetch off the critical path so it does not race LCP.
    return deferIdle(() => {
      fetch("/api/github/latest-release")
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((d: GitHubLatestRelease | null) =>
          setState(d?.url ? { status: "ready", release: d } : { status: "none" }),
        )
        .catch(() => setState({ status: "unavailable" }));
    });
  }, []);

  if (state.status !== "ready") {
    return (
      <PanelShell label={t("release.label")} labelRight={"\u00a0"} delay={delay}>
        <div className={BODY_CLASS}>
          <span className="text-muted-foreground text-mono-sm">{t(STATUS_KEY[state.status])}</span>
        </div>
      </PanelShell>
    );
  }

  const { release } = state;
  return (
    <PanelShell
      label={t("release.label")}
      labelRight={
        <time
          dateTime={release.publishedAt}
          title={formatAbsolute(release.publishedAt, locale)}
          className="text-muted-foreground-dim"
        >
          {relativeTime(release.publishedAt, locale)}
        </time>
      }
      delay={delay}
    >
      <a
        href={release.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block group relative ${BODY_CLASS}`}
      >
        <span
          aria-hidden="true"
          className="absolute top-3 right-5 text-label text-muted-foreground-dim group-hover:text-foreground transition-colors duration-150 select-none uppercase"
        >
          {t("release.open")} →
        </span>

        <div className="space-y-1.5 pr-20">
          <div className="flex items-baseline justify-between gap-4 min-w-0">
            <span className="text-muted-foreground/80 text-mono-sm shrink-0">{t("release.repo")}</span>
            <span className="text-foreground/90 text-mono-sm text-right truncate min-w-0">
              {release.repo}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-4 min-w-0">
            <span className="text-muted-foreground/80 text-mono-sm shrink-0">{t("release.tag")}</span>
            <span className="text-mono-sm text-right truncate min-w-0">
              <TagDisplay tag={release.tagName} />
            </span>
          </div>
          {release.name && (
            <div className="flex items-baseline justify-between gap-4 min-w-0">
              <span className="text-muted-foreground/80 text-mono-sm shrink-0">{t("release.name")}</span>
              <span className="text-muted-foreground text-mono-sm text-right truncate min-w-0">
                {release.name}
              </span>
            </div>
          )}
        </div>
        <span className="sr-only"> ({t("links.opensNewWindow")})</span>
      </a>
    </PanelShell>
  );
}
