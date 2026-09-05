import { ExternalLink } from "lucide-react";

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
import { BootBlock, Cmd, Accent, Tag, MacWindow } from "./Terminal";
import { SectionHeader } from "./SectionHeader";
import { ErrorBoundary } from "./ErrorBoundary";

import { projects, type Project } from "@/data/projectsData";
import { MotionProvider } from "./MotionProvider";
import { useLocale } from "@/stores/settingsStore";
import { useEffect, useState } from "react";
import { deferIdle } from "./Decorations/_utils";
import { GITHUB_USERNAME } from "@/lib/constants";
import type { GitHubProjectRelease } from "@/types";
import type { Locale } from "@/lib/i18n";
import { pluralize } from "@/lib/plural";

type ReleaseMap = Record<string, GitHubProjectRelease | null>;

const RELEASE_FORMS = {
  en: ["release", "releases"] as [string, string],
  ru: ["\u0440\u0435\u043b\u0438\u0437", "\u0440\u0435\u043b\u0438\u0437\u0430", "\u0440\u0435\u043b\u0438\u0437\u043e\u0432"] as [string, string, string],
};

const REPO_LINK = new RegExp(`^https://github\\.com/${GITHUB_USERNAME}/([^/#?]+)/?$`, "i");

function repoNames(project: Project): string[] {
  return project.links.map((l) => REPO_LINK.exec(l.href)?.[1]).filter((r): r is string => !!r);
}

function monthYear(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { month: "short", year: "numeric" }).format(d);
}

/** Latest release of the project, real data from GitHub, or nothing. */
function ReleaseLine({ release, locale, t }: { release: GitHubProjectRelease; locale: Locale; t: (k: "links.opensNewWindow") => string }) {
  const tag = release.tagName.match(/^(v)(.+)$/i);
  return (
    <a
      href={release.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${release.repo} ${release.tagName} (${t("links.opensNewWindow")})`}
      className="inline-flex flex-wrap items-baseline gap-x-2 font-mono text-mono-sm text-muted-foreground hover:text-foreground transition-colors duration-150 tabular-nums"
    >
      <span>
        {tag ? (
          <>
            <span className="text-muted-foreground-dim">{tag[1]}</span>
            <span className="text-foreground/85">{tag[2]}</span>
          </>
        ) : (
          <span className="text-foreground/85">{release.tagName}</span>
        )}
        {release.prerelease && <span className="text-muted-foreground-dim"> pre</span>}
      </span>
      <span aria-hidden="true" className="text-muted-foreground-dim">·</span>
      <span>{pluralize(release.count, locale, RELEASE_FORMS)}</span>
      <span aria-hidden="true" className="text-muted-foreground-dim">·</span>
      <span>{monthYear(release.publishedAt, locale)}</span>
    </a>
  );
}

function ProjectEntry({ project, releases }: { project: Project; releases: ReleaseMap }) {
  const { t, locale } = useLocale();
  const release = repoNames(project).map((r) => releases[r]).find((r): r is GitHubProjectRelease => !!r);

  return (
    <div id={project.slug} className="py-5 border-b border-dashed border-rule last:border-b-0 group scroll-mt-20">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span
            className="text-muted-foreground-dim shrink-0 text-label"
            aria-hidden="true"
          >
            ├──
          </span>
          <h2
            className="text-foreground/85 group-hover:text-foreground transition-colors duration-150 font-sans text-mono-lg font-medium"
          >
            {project.name}
          </h2>
          {project.featured && <Tag variant="highlight">{t("projects.featured")}</Tag>}
          {project.status && (
            <span className="text-muted-foreground text-label">
              {project.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-label">
            {project.platforms.join(" / ")}
          </span>
          {project.year && (
            <span className="text-muted-foreground text-label">
              {project.year}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 text-foreground/60 group-hover:text-foreground/75 transition-colors duration-150 pl-6 font-sans text-mono" style={{ lineHeight: 1.75 }}>
        {project.description}
      </p>

      {/* Long description */}
      {project.longDescription && (
        <p className="mt-2 text-foreground/75 pl-6 font-sans text-mono-sm" style={{ lineHeight: 1.7 }}>
          {project.longDescription}
        </p>
      )}

      {release && (
        <div className="mt-2.5 pl-6">
          <ReleaseLine release={release} locale={locale} t={t} />
        </div>
      )}

      {/* Tags + links */}
      <div className="mt-3 pl-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-muted-foreground bg-muted cursor-default text-xs"
              style={{ borderRadius: "2px" }}
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="flex-1" />
        <div className="flex items-center gap-3">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 text-label"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.type} (${t("links.opensNewWindow")})`}
              data-umami-event="click-project-link"
              data-umami-event-target={`${project.name}:${link.type}`}
            >
              {link.type.startsWith("GitHub") ? <GithubIcon size={11} /> : <ExternalLink size={10} />}
              {link.type}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectsPage() {
  const { t } = useLocale();
  const [releases, setReleases] = useState<ReleaseMap>({});

  useEffect(() => {
    // Decorative enrichment: fetched after load so it never sits on the critical path.
    return deferIdle(() => {
      fetch("/api/github/releases")
        .then((r) => (r.ok ? r.json() : {}))
        .then((d: ReleaseMap) => setReleases(d ?? {}))
        .catch(() => {});
    });
  }, []);
  return (
    <ErrorBoundary>
    <MotionProvider>
    <div className="space-y-8">
      <SectionHeader
        level={1}
        number="04"
        label="PROJECTS"
        heading="Projects"
        meta={`${projects.length} ${t("projectsPage.entries") ?? "ENTRIES"}`}
      />

      {/* Boot */}
      <BootBlock
        lines={[
          {
            status: "OK",
            text: (
              <>
                Loaded <Accent>po4yka.dev/projects</Accent>
              </>
            ),
          },
          { status: "OK", text: `${t("projectsPage.mountedIndex")} — ${projects.length} ${t("projectsPage.entriesFound")}` },
          { status: "INFO", text: t("projectsPage.detailsInline") },
        ]}
      />

      {/* List command */}
      <Cmd>
        ls -lt <Accent>./projects/</Accent>
      </Cmd>

      {/* Project entries + sticky index rail (lg). The rail is the `ls`
          output: one row per project, deep-linking into the entry below. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <nav
          aria-label={t("projectsPage.indexLabel")}
          className="hidden lg:block lg:col-span-3 lg:sticky lg:top-16"
        >
          <div
            className="overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 2 }}
          >
            <div className="flex items-baseline justify-between px-4 py-2" style={{ borderBottom: "1px solid var(--rule)" }}>
              <span className="label-meta">INDEX</span>
              <span className="font-mono text-muted-foreground-dim" style={{ fontSize: 11, letterSpacing: "0.04em" }}>
                {projects.length}
              </span>
            </div>
            <ol className="list-none m-0 px-3 py-2">
              {projects.map((project, i) => (
                <li key={project.slug}>
                  <a
                    href={`#${project.slug}`}
                    className="flex items-baseline gap-2 py-1.5 px-1 -mx-1 rounded-[2px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 font-mono text-mono-sm"
                  >
                    <span className="text-muted-foreground-dim tabular-nums shrink-0" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate min-w-0 font-sans">{project.name}</span>
                    {project.year && (
                      <span className="ml-auto text-muted-foreground-dim tabular-nums shrink-0">{project.year}</span>
                    )}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="lg:col-span-9 min-w-0">
          <MacWindow
            label={`projects — ${projects.length} ${t("projectsPage.entries")}`}
            titleExt="~/projects | main"
            sectionNumber="04"
            delay={0.05}
            statusLine
          >
            <ul className="list-none m-0 p-0">
              {projects.map((project) => (
                <li key={project.slug}>
                  <ProjectEntry project={project} releases={releases} />
                </li>
              ))}
            </ul>
          </MacWindow>
        </div>
      </div>

    </div>
    </MotionProvider>
    </ErrorBoundary>
  );
}
