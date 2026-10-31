import { useState } from "react";
import { changelog } from "@/data/changelog";
import { Cmd, Em, Tag } from "./Terminal";
import { SectionHeader } from "./SectionHeader";
import { MotionProvider } from "./MotionProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { useLocale } from "@/stores/settingsStore";

const GH_REPO = "po4yka/blog";

/**
 * Release notes for the site itself, generated from conventional commits:
 * one release per day that shipped a feat, fix or perf change, versioned
 * like a mobile build (calendar version + commit ordinal).
 */
const TYPES = ["feat", "fix", "perf"] as const;
type Filter = "all" | (typeof TYPES)[number];

const allEntries = changelog.flatMap((r) => r.entries);
const COUNTS: Record<Filter, number> = {
  all: allEntries.length,
  ...(Object.fromEntries(TYPES.map((type) => [type, allEntries.filter((e) => e.type === type).length])) as Record<
    (typeof TYPES)[number],
    number
  >),
};

export function ChangelogPage() {
  const { t } = useLocale();
  const latest = changelog[0];
  // "all" on the server and on hydration, so every entry is in the static HTML.
  const [filter, setFilter] = useState<Filter>("all");
  const releases = changelog
    .map((r) => ({ ...r, entries: filter === "all" ? r.entries : r.entries.filter((e) => e.type === filter) }))
    .filter((r) => r.entries.length > 0);

  return (
    <ErrorBoundary>
    <MotionProvider>
    <div className="space-y-8">
      <SectionHeader
        level={1}
        number="08"
        label="CHANGELOG"
        heading={t("changelog.heading")}
        meta={latest ? `${t("changelog.latest")} ${latest.version} (${latest.build})` : undefined}
        description={t("changelog.description")}
      />

      <Cmd>
        git log <Em>--format=release</Em> | head -{changelog.length}
      </Cmd>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("changelog.filter")}>
          {(["all", ...TYPES] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-11 sm:min-h-0 rounded-[2px] border font-mono text-label cursor-pointer transition-colors duration-150 ${
                filter === value
                  ? "text-foreground font-medium border-border bg-muted"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
              }`}
            >
              {value === "all" ? t("changelog.all") : value}
              <span className="tabular-nums text-muted-foreground-dim">{COUNTS[value]}</span>
            </button>
          ))}
        </div>
        <p className="m-0 label-meta text-muted-foreground tabular-nums" aria-live="polite">
          {COUNTS[filter]} / {COUNTS.all} {t("changelog.shown")}
        </p>
      </div>

      <ol className="list-none m-0 p-0 space-y-8">
        {releases.map((release) => (
          <li key={release.version} className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-3">
            {/* Version column */}
            <div className="md:col-span-3">
              <div className="font-mono text-foreground font-medium tabular-nums text-mono-lg">
                {release.version}
              </div>
              <div className="mt-1 label-meta text-muted-foreground-dim">
                {t("changelog.build")} {release.build}
              </div>
            </div>

            {/* Entries */}
            <ul className="md:col-span-9 list-none m-0 p-0" style={{ borderTop: "1px solid var(--rule)" }}>
              {release.entries.map((entry) => (
                <li
                  key={entry.hash}
                  className="grid grid-cols-[3.75rem_minmax(0,1fr)_auto] items-baseline gap-x-3 py-2.5"
                  style={{ borderBottom: "1px dashed var(--rule)" }}
                >
                  <Tag variant={entry.breaking ? "highlight" : "default"}>{entry.type}</Tag>
                  <span className="font-sans text-sm text-foreground/85 leading-[1.5]">
                    {entry.scope && (
                      <span className="font-mono text-mono-sm text-muted-foreground">{entry.scope}: </span>
                    )}
                    {entry.subject}
                  </span>
                  <a
                    href={`https://github.com/${GH_REPO}/commit/${entry.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${entry.hash} (${t("links.opensNewWindow")})`}
                    className="font-mono text-mono-sm text-muted-foreground-dim hover:text-foreground hover:underline underline-offset-4 transition-colors duration-150 tabular-nums"
                  >
                    {entry.hash}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
    </MotionProvider>
    </ErrorBoundary>
  );
}
