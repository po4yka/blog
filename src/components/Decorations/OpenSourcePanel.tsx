import { useState, useEffect } from "react";
import { m } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell } from "./_helpers";
import { pluralize } from "@/lib/plural";
import { useLocale } from "@/stores/settingsStore";
import type { GitHubRepoSummary } from "@/types";
import { ease, stagger } from "@/lib/motion";

const MAX_REPOS = 6;

const LANG_GLYPH: Record<string, string> = {
  TypeScript: "TS",
  JavaScript: "JS",
  Python: "PY",
  Go: "GO",
  Rust: "RS",
  Kotlin: "KT",
  Java: "JV",
  Swift: "SW",
  Ruby: "RB",
  "C++": "C+",
  Shell: "SH",
  HTML: "HT",
  CSS: "CS",
  Dart: "DA",
};

function langGlyph(language: string | null): string {
  if (!language) return "--";
  return LANG_GLYPH[language] ?? language.slice(0, 2).toUpperCase();
}

export function OpenSourcePanel({ delay = 0 }: { delay?: number }) {
  const { t, locale } = useLocale();
  const { ref, inView } = useInView(0.1);
  const [repos, setRepos] = useState<GitHubRepoSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    fetch("/api/github/repos")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: unknown) => {
        const list = Array.isArray(data) ? [...(data as GitHubRepoSummary[])] : [];
        const sorted = list.sort((a, b) => b.stars - a.stars).slice(0, MAX_REPOS);
        setRepos(sorted);
        setStatus(sorted.length > 0 ? "ready" : "unavailable");
      })
      .catch(() => setStatus("unavailable"));
  }, []);

  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);

  return (
    <MotionProvider>
      <div ref={ref}>
        <PanelShell
          label="po4yka / github"
          labelRight={
            status === "ready"
              ? pluralize(totalStars, locale, { en: ["star", "stars"], ru: ["звезда", "звезды", "звёзд"] }).toUpperCase()
              : "\u00a0"
          }
          delay={delay}
        >
          <div className="space-y-0">
            {repos.map((repo, i) => (
              <m.a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 py-2.5 px-5 no-underline border-b border-border/30 last:border-b-0"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: delay + i * stagger.fast, ease }}
              >
                <span
                  className="label-meta shrink-0 w-[18px] text-center"
                  style={{ color: "var(--muted-foreground-dim)" }}
                  title={repo.language ?? t("projects.unknownLanguage")}
                >
                  {langGlyph(repo.language)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-foreground/80 group-hover:text-foreground group-hover:underline transition-colors duration-200 text-mono-sm truncate">
                      {repo.name}
                      {/* The visible name, stars and description stay in the link's name; this only adds the new-window note. */}
                      <span className="sr-only"> ({t("links.opensNewWindow")})</span>
                    </span>
                    <span
                      className="text-label shrink-0"
                      style={{ color: "var(--muted-foreground-dim)" }}
                    >
                      &#9733; {repo.stars}
                    </span>
                  </div>
                  {repo.description && (
                    <p className="text-muted-foreground text-label line-clamp-2 mt-0.5">
                      {repo.description}
                    </p>
                  )}
                </div>
              </m.a>
            ))}
            {/* Until repos arrive (or if the list is unavailable) the frame keeps
                placeholder rows of the usual one-line-description height. */}
            {status !== "ready" &&
              Array.from({ length: MAX_REPOS }, (_, i) => (
                <div key={`placeholder-${i}`} className="flex items-start gap-3 py-2.5 px-5 border-b border-border/30 last:border-b-0">
                  <span className="label-meta shrink-0 w-[18px]">{"\u00a0"}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-muted-foreground text-mono-sm">
                      {i === 0 && status === "unavailable" ? t("projects.repoListUnavailable") : "\u00a0"}
                    </span>
                    <p className="text-label mt-0.5">{"\u00a0"}</p>
                  </div>
                </div>
              ))}
          </div>
        </PanelShell>
      </div>
    </MotionProvider>
  );
}
