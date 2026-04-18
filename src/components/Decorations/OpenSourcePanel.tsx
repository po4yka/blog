import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell } from "./_helpers";
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
  const { ref, inView } = useInView(0.1);
  const [repos, setRepos] = useState<GitHubRepoSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/github/repos")
      .then((r) => r.json())
      .then((data: GitHubRepoSummary[]) => {
        const sorted = [...data].sort((a, b) => b.stars - a.stars);
        setRepos(sorted.slice(0, MAX_REPOS));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || repos.length === 0) return null;

  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);

  return (
    <MotionProvider>
      <div ref={ref}>
        <PanelShell
          label="po4yka / github"
          labelRight={`${totalStars} STARS`}
          delay={delay}
        >
          <div className="space-y-0">
            {repos.map((repo, i) => (
              <motion.a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 py-2.5 -mx-2 px-2 no-underline rounded-[2px] border-b border-border/30 last:border-b-0"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: delay + i * stagger.fast, ease }}
              >
                <span
                  className="label-meta shrink-0 w-[18px] text-center"
                  style={{ color: "var(--muted-foreground-dim)" }}
                  title={repo.language ?? "Unknown"}
                >
                  {langGlyph(repo.language)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-foreground/80 group-hover:text-foreground group-hover:underline transition-colors duration-200 text-mono-sm truncate">
                      {repo.name}
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
              </motion.a>
            ))}
          </div>
        </PanelShell>
      </div>
    </MotionProvider>
  );
}
