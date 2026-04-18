import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { useState, useEffect } from "react";
import type { GitHubRepoSummary } from "@/types";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell, UsageBar } from "./_helpers";

// ─── LanguagePanel: real GitHub language distribution ─────────────

interface LangStat {
  label: string;
  pct: number;
}

function aggregateLanguages(repos: GitHubRepoSummary[]): LangStat[] {
  const counts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) counts[repo.language] = (counts[repo.language] ?? 0) + 1;
  }
  const entries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const total = entries.reduce((s, [, n]) => s + n, 0);
  return entries.map(([label, count]) => ({
    label,
    pct: Math.round((count / total) * 100),
  }));
}

export function LanguagePanel({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [langs, setLangs] = useState<LangStat[]>([]);
  const [repoCount, setRepoCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/github/repos")
      .then((r) => r.json())
      .then((repos: GitHubRepoSummary[]) => {
        setLangs(aggregateLanguages(repos));
        setRepoCount(repos.length);
      })
      .catch(() => {}); // widget is atmospheric, fail silently
  }, []);

  return (
    <MotionProvider>
      <PanelShell
        label="languages"
        labelRight={repoCount !== null ? `${repoCount} repos` : undefined}
        delay={delay}
      >
        <div ref={ref} className="px-5 py-3.5 space-y-1.5 min-h-[100px]">
          {langs.map((lang, i) => (
            <motion.div
              key={lang.label}
              className="flex items-center gap-3 -mx-1 px-1 py-[1px] transition-colors duration-150 text-label"
            >
              <span
                className="text-muted-foreground shrink-0"
                style={{ minWidth: "80px" }}
              >
                {lang.label}
              </span>
              <UsageBar pct={lang.pct} delay={delay + 0.06 + i * 0.04} inView={inView} />
              <span className="text-muted-foreground w-[32px] text-right">
                {lang.pct}%
              </span>
            </motion.div>
          ))}
        </div>
        <div
          className="flex items-center px-5 py-2 text-muted-foreground text-xs"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span>github.com/po4yka</span>
        </div>
      </PanelShell>
    </MotionProvider>
  );
}
