import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { MotionProvider } from "@/components/MotionProvider";
import { MacWindow } from "@/components/Terminal";
import type { GitHubRepoSummary } from "@/types";
import { ease, stagger } from "@/lib/motion";

const MAX_REPOS = 6;

function LanguageDot({ language }: { language: string | null }) {
  // Neutral dot — no chromatic language colors
  return (
    <span
      className="inline-block w-[7px] h-[7px] rounded-[2px] shrink-0 bg-muted-foreground"
      style={{ opacity: 0.5 }}
      title={language ?? "Unknown"}
    />
  );
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
        <MacWindow title="open-source" subtitle={`${totalStars} stars`} delay={delay}>
          <div className="space-y-0">
            {repos.map((repo, i) => (
              <motion.a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 py-2.5 -mx-2 px-2 no-underline font-mono rounded-[2px] border-b border-border/30 last:border-b-0"
                initial={{ opacity: 0, y: 6 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.3, delay: delay + i * stagger.fast, ease }}
              >
                <LanguageDot language={repo.language} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-foreground/80 group-hover:text-foreground group-hover:underline transition-colors duration-200 text-mono-sm truncate">
                      {repo.name}
                    </span>
                    {repo.stars > 0 && (
                      <span className="text-muted-foreground text-label shrink-0">
                        {repo.stars}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-muted-foreground text-label truncate mt-0.5">
                      {repo.description}
                    </p>
                  )}
                </div>
              </motion.a>
            ))}
          </div>
        </MacWindow>
      </div>
    </MotionProvider>
  );
}
