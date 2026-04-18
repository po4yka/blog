import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { useState, useEffect, useMemo } from "react";
import type { GitHubRepoSummary } from "@/types";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell, UsageBar } from "./_helpers";
import { createSeededRng } from "./_utils";

// ─── CPU Panel ─────────────────────────────────────────────────────
// Fluctuates on a 3s interval; scroll-velocity link dropped per motion-
// reduction pass (useActivityStore removed).

export function CpuMonitor({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const rng = createSeededRng(42);

  /* eslint-disable react-hooks/exhaustive-deps */
  const initialCores = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        label: `Core${i + 1}`,
        pct: Math.round(rng() * 70 + 5),
        temp: Math.round(rng() * 20 + 35),
      })),
    []
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const [cores, setCores] = useState(initialCores);
  const [loadAvg, setLoadAvg] = useState([1.47, 1.22, 0.98]);

  useEffect(() => {
    const id = setInterval(() => {
      setCores((prev) =>
        prev.map((c) => ({
          ...c,
          pct: Math.max(2, Math.min(95, c.pct + Math.round((Math.random() - 0.5) * 8))),
          temp: Math.max(30, Math.min(72, c.temp + Math.round((Math.random() - 0.5) * 3))),
        }))
      );
      setLoadAvg((prev) => prev.map((v) => +Math.max(0.1, Math.min(3.5, v + (Math.random() - 0.5) * 0.2)).toFixed(2)));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const avgLoad = (cores.reduce((s, c) => s + c.pct, 0) / cores.length).toFixed(0);

  return (
    <MotionProvider>
    <PanelShell label="cpu" labelRight={`avg ${avgLoad}%`} delay={delay}>
      <div ref={ref} className="px-5 py-3.5 space-y-1.5">
        {cores.map((core, i) => (
          <motion.div
            key={core.label}
            className="flex items-center gap-3 -mx-1 px-1 py-[1px] transition-colors duration-150 text-label"
          >
            <span className="text-muted-foreground w-[42px] sm:w-[48px] shrink-0">{core.label}</span>
            <UsageBar pct={core.pct} delay={delay + 0.06 + i * 0.04} inView={inView} />
            <span className="text-muted-foreground w-[32px] text-right">{core.pct}%</span>
            <span className="text-muted-foreground-dim w-[32px] text-right hidden sm:inline">{core.temp}°C</span>
          </motion.div>
        ))}
      </div>
      <div
        className="flex items-center gap-5 px-5 py-2 text-muted-foreground text-xs"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span>Load Average:</span>
        <span className="text-foreground/60">{loadAvg[0]}</span>
        <span className="text-muted-foreground">{loadAvg[1]}</span>
        <span className="text-muted-foreground-dim">{loadAvg[2]}</span>
      </div>
    </PanelShell>
    </MotionProvider>
  );
}

// ─── Memory / Swap / Disk Panel ────────────────────────────────────

const memBase = [
  { label: "mem", total: 15.2, unit: "GiB", basePct: 37, scrollScale: 20 },
  { label: "swap", total: 4.0, unit: "GiB", basePct: 24, scrollScale: 6 },
  { label: "disk", total: 512, unit: "GB", basePct: 28, scrollScale: 0 },
  { label: "cache", total: 15.2, unit: "GiB", basePct: 67, scrollScale: 20 },
];

function lerp(current: number, target: number, factor: number) {
  return current + (target - current) * factor;
}

export function MemoryPanel({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);

  const [rows, setRows] = useState(
    memBase.map((b) => ({
      label: b.label,
      used: ((b.total * b.basePct) / 100).toFixed(b.total >= 100 ? 0 : 1),
      total: String(b.total),
      unit: b.unit,
      pct: b.basePct,
    })),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRows((prev) =>
        prev.map((row, i) => {
          const base = memBase[i]!;
          const pct = Math.round(lerp(row.pct, base.basePct, 0.15));
          const used = ((base.total * pct) / 100).toFixed(base.total >= 100 ? 0 : 1);
          return { ...row, pct, used };
        }),
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <MotionProvider>
    <PanelShell label="mem" labelRight="15.2 GiB" delay={delay}>
      <div ref={ref} className="px-5 py-3.5 space-y-1.5">
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            className="flex items-center gap-3 -mx-1 px-1 py-[1px] transition-colors duration-150 text-label"
          >
            <span className="text-muted-foreground w-[42px] shrink-0">{row.label}</span>
            <UsageBar pct={row.pct} delay={delay + 0.06 + i * 0.04} inView={inView} />
            <span className="text-muted-foreground w-[70px] sm:w-[90px] text-right">
              {row.used}<span className="hidden sm:inline"> / {row.total}</span>
            </span>
            <span className="text-muted-foreground-dim w-[28px] text-right">{row.pct}%</span>
          </motion.div>
        ))}
      </div>
    </PanelShell>
    </MotionProvider>
  );
}

// ─── Mini Disk Bars ────────────────────────────────────────────────

export function DiskBars({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);

  const [disks] = useState([
    { label: "root", used: 15, total: 226, unit: "GiB" },
    { label: "media", used: 4.1, total: 7.21, unit: "TiB" },
  ]);

  return (
    <MotionProvider>
    <PanelShell label="disks" labelRight="+94K" delay={delay}>
      <div ref={ref} className="px-5 py-3.5 space-y-2">
        {disks.map((d, i) => {
          const pct = Math.round((d.used / d.total) * 100);
          return (
            <motion.div
              key={d.label}
              className="flex items-center gap-3 -mx-1 px-1 py-[1px] transition-colors duration-150 text-label"
            >
              <span className="text-muted-foreground w-[40px] sm:w-[46px] shrink-0">{d.label}</span>
              <span className="text-muted-foreground-dim w-[48px] sm:w-[54px]">Used: {pct}%</span>
              <UsageBar pct={pct} delay={delay + 0.06 + i * 0.04} inView={inView} />
              <span className="text-muted-foreground-dim">
                {d.used} {d.unit}
              </span>
            </motion.div>
          );
        })}
      </div>
    </PanelShell>
    </MotionProvider>
  );
}

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
