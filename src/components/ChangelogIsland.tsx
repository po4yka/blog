import { changelog } from "@/data/changelog";
import { Cmd, Accent, Tag } from "./Terminal";
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
export function ChangelogPage() {
  const { t } = useLocale();
  const latest = changelog[0];

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
        git log <Accent>--format=release</Accent> | head -{changelog.length}
      </Cmd>

      <ol className="list-none m-0 p-0 space-y-8">
        {changelog.map((release) => (
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
