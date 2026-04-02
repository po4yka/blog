import { motion } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { useState, useEffect, useMemo } from "react";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell, UsageBar } from "./_helpers";
import { createSeededRng } from "./_utils";
import { useActivityStore } from "@/stores/activityStore";
import { useSettingsStore } from "@/stores/settingsStore";

// ─── CPU Panel with live-updating values ───────────────────────────

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

  // Slowly fluctuate values, biased by scroll activity
  const [loadAvg, setLoadAvg] = useState([1.47, 1.22, 0.98]);
  useEffect(() => {
    const id = setInterval(() => {
      const { scrollProgress, scrollVelocity } = useActivityStore.getState();
      const reduceMotion = useSettingsStore.getState().reduceMotion;
      const bias = reduceMotion ? 0 : scrollProgress * 25 + scrollVelocity * 15;

      setCores((prev) =>
        prev.map((c) => ({
          ...c,
          pct: Math.max(2, Math.min(95, c.pct + Math.round((Math.random() - 0.5) * 8 + bias * 0.3))),
          temp: Math.max(30, Math.min(72, c.temp + Math.round((Math.random() - 0.5) * 3 + bias * 0.05))),
        }))
      );

      // Interpolate load averages
      const t = reduceMotion ? 0 : scrollProgress;
      setLoadAvg([
        +(1.47 + t * 1.65).toFixed(2),
        +(1.22 + t * 1.62).toFixed(2),
        +(0.98 + t * 1.43).toFixed(2),
      ]);
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
            className="flex items-center gap-3 -mx-1 px-1 py-[1px] hover:bg-accent/[0.04] transition-colors duration-150 text-label rounded-[3px]"
          >
            <span className="text-muted-foreground/35 w-[48px] shrink-0">{core.label}</span>
            <UsageBar pct={core.pct} delay={delay + 0.06 + i * 0.04} inView={inView} />
            <span className="text-muted-foreground/45 w-[32px] text-right">{core.pct}%</span>
            <span className="text-muted-foreground/20 w-[32px] text-right">{core.temp}°C</span>
          </motion.div>
        ))}
      </div>
      <div
        className="flex items-center gap-5 px-5 py-2 text-muted-foreground/25 text-xs"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span>Load Average:</span>
        <span className="text-foreground/35">{loadAvg[0]}</span>
        <span className="text-foreground/30">{loadAvg[1]}</span>
        <span className="text-foreground/25">{loadAvg[2]}</span>
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
      const sp = useSettingsStore.getState().reduceMotion
        ? 0
        : useActivityStore.getState().scrollProgress;

      setRows((prev) =>
        prev.map((row, i) => {
          const base = memBase[i]!;
          const targetPct = Math.min(95, base.basePct + sp * base.scrollScale);
          const pct = Math.round(lerp(row.pct, targetPct, 0.15));
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
            className="flex items-center gap-3 -mx-1 px-1 py-[1px] hover:bg-accent/[0.04] transition-colors duration-150 text-label rounded-[3px]"
          >
            <span className="text-muted-foreground/35 w-[42px] shrink-0">{row.label}</span>
            <UsageBar pct={row.pct} delay={delay + 0.06 + i * 0.04} inView={inView} />
            <span className="text-muted-foreground/40 w-[90px] text-right">
              {row.used} / {row.total}
            </span>
            <span className="text-muted-foreground/25 w-[28px] text-right">{row.pct}%</span>
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

  const [disks, setDisks] = useState([
    { label: "root", used: 15, total: 226, unit: "GiB" },
    { label: "media", used: 4.1, total: 7.21, unit: "TiB" },
  ]);

  useEffect(() => {
    const id = setInterval(() => {
      const sp = useSettingsStore.getState().reduceMotion
        ? 0
        : useActivityStore.getState().scrollProgress;
      setDisks((prev) =>
        prev.map((d, i) =>
          i === 0 ? { ...d, used: +(15 + sp * 2).toFixed(1) } : d,
        ),
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <MotionProvider>
    <PanelShell label="disks" labelRight="+94K" delay={delay}>
      <div ref={ref} className="px-5 py-3.5 space-y-2">
        {disks.map((d, i) => {
          const pct = Math.round((d.used / d.total) * 100);
          return (
            <motion.div
              key={d.label}
              className="flex items-center gap-3 -mx-1 px-1 py-[1px] hover:bg-accent/[0.04] transition-colors duration-150 text-label rounded-[3px]"
            >
              <span className="text-muted-foreground/35 w-[46px] shrink-0">{d.label}</span>
              <span className="text-muted-foreground/30 w-[54px]">Used: {pct}%</span>
              <UsageBar pct={pct} delay={delay + 0.06 + i * 0.04} inView={inView} />
              <span className="text-muted-foreground/30">
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
