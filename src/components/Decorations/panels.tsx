import { motion } from "motion/react";
import { useInView } from "@/components/useInView";
import { useState, useEffect, useMemo } from "react";
import { MotionProvider } from "@/components/MotionProvider";
import { seeded, PanelShell, UsageBar } from "./_helpers";

// ─── CPU Panel with live-updating values ───────────────────────────

export function CpuMonitor({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const rng = seeded(42);

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

  // Slowly fluctuate values
  useEffect(() => {
    const id = setInterval(() => {
      setCores((prev) =>
        prev.map((c) => ({
          ...c,
          pct: Math.max(2, Math.min(95, c.pct + Math.round((Math.random() - 0.5) * 8))),
          temp: Math.max(30, Math.min(72, c.temp + Math.round((Math.random() - 0.5) * 3))),
        }))
      );
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
        <span className="text-foreground/35">1.47</span>
        <span className="text-foreground/30">1.22</span>
        <span className="text-foreground/25">0.98</span>
      </div>
    </PanelShell>
    </MotionProvider>
  );
}

// ─── Memory / Swap / Disk Panel ────────────────────────────────────

export function MemoryPanel({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);

  const rows = [
    { label: "mem", used: "5.65", total: "15.2", unit: "GiB", pct: 37 },
    { label: "swap", used: "0.94", total: "4.0", unit: "GiB", pct: 24 },
    { label: "disk", used: "142", total: "512", unit: "GB", pct: 28 },
    { label: "cache", used: "10.2", total: "15.2", unit: "GiB", pct: 67 },
  ];

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

  const disks = [
    { label: "root", used: 15, total: 226, unit: "GiB" },
    { label: "media", used: 4.1, total: 7.21, unit: "TiB" },
  ];

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
