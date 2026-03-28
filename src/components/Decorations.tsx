import { motion } from "motion/react";
import { useInView } from "./useInView";
import { useState, useEffect, useMemo, useCallback } from "react";

const mono = "'JetBrains Mono', monospace";
const ease = [0.25, 0.46, 0.45, 0.94] as const;

// ─── Helpers ───────────────────────────────────────────────────────

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function barColor(pct: number): string {
  if (pct >= 80) return "var(--signal-red)";
  if (pct >= 50) return "var(--signal-yellow)";
  return "var(--signal-green)";
}

/** Shared panel shell with hover lift */
function PanelShell({
  label,
  labelRight,
  children,
  delay = 0,
}: {
  label: string;
  labelRight?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.08);

  return (
    <motion.div
      ref={ref}
      className="overflow-hidden"
      style={{
        borderRadius: "10px",
        border: "1px solid var(--border)",
        background: "var(--panel-bg)",
        fontFamily: mono,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease }}
      whileHover={{
        y: -1,
        transition: { duration: 0.2 },
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-2.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="text-muted-foreground/50 uppercase"
          style={{ fontSize: "0.75rem", letterSpacing: "0.12em", fontWeight: 500 }}
        >
          {label}
        </span>
        {labelRight && (
          <span className="text-muted-foreground/30" style={{ fontSize: "0.6875rem" }}>
            {labelRight}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

// ─── Animated bar block ────────────────────────────────────────────

function UsageBar({
  pct,
  blocks = 22,
  delay = 0,
  inView = true,
}: {
  pct: number;
  blocks?: number;
  delay?: number;
  inView?: boolean;
}) {
  const filled = Math.round((pct / 100) * blocks);
  const empty = blocks - filled;
  const color = barColor(pct);

  return (
    <motion.span
      className="inline-flex items-center cursor-default"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.4, delay }}
      title={`${pct}%`}
    >
      <span style={{ color, fontSize: "0.75rem", letterSpacing: "-0.5px" }}>
        {"█".repeat(filled)}
      </span>
      <span style={{ color: "var(--bar-empty)", fontSize: "0.75rem", letterSpacing: "-0.5px" }}>
        {"█".repeat(empty)}
      </span>
    </motion.span>
  );
}

// ─── CPU Panel with live-updating values ───────────────────────────

export function CpuMonitor({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const rng = seeded(42);

  const initialCores = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        label: `Core${i + 1}`,
        pct: Math.round(rng() * 70 + 5),
        temp: Math.round(rng() * 20 + 35),
      })),
    []
  );

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
    <PanelShell label="cpu" labelRight={`avg ${avgLoad}%`} delay={delay}>
      <div ref={ref} className="px-5 py-3.5 space-y-1.5">
        {cores.map((core, i) => (
          <motion.div
            key={core.label}
            className="flex items-center gap-3 -mx-1 px-1 py-[1px] hover:bg-accent/[0.04] transition-colors duration-150"
            style={{ fontSize: "0.6875rem", borderRadius: "3px" }}
          >
            <span className="text-muted-foreground/35 w-[48px] shrink-0">{core.label}</span>
            <UsageBar pct={core.pct} delay={delay + 0.06 + i * 0.04} inView={inView} />
            <span className="text-muted-foreground/45 w-[32px] text-right">{core.pct}%</span>
            <span className="text-muted-foreground/20 w-[32px] text-right">{core.temp}°C</span>
          </motion.div>
        ))}
      </div>
      <div
        className="flex items-center gap-5 px-5 py-2 text-muted-foreground/25"
        style={{ borderTop: "1px solid var(--border)", fontSize: "0.625rem" }}
      >
        <span>Load Average:</span>
        <span className="text-foreground/35">1.47</span>
        <span className="text-foreground/30">1.22</span>
        <span className="text-foreground/25">0.98</span>
      </div>
    </PanelShell>
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
    <PanelShell label="mem" labelRight="15.2 GiB" delay={delay}>
      <div ref={ref} className="px-5 py-3.5 space-y-1.5">
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            className="flex items-center gap-3 -mx-1 px-1 py-[1px] hover:bg-accent/[0.04] transition-colors duration-150"
            style={{ fontSize: "0.6875rem", borderRadius: "3px" }}
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
  );
}

// ─── Network Sparkline with hover crosshair ────────────────────────

export function NetworkGraph({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const rng = seeded(77);

  const points = useMemo(() => {
    const pts: number[] = [];
    let val = 30;
    for (let i = 0; i < 64; i++) {
      val += (rng() - 0.45) * 18;
      val = Math.max(5, Math.min(95, val));
      pts.push(val);
    }
    return pts;
  }, []);

  const w = 400;
  const h = 90;
  const step = w / (points.length - 1);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h - (p / 100) * h).toFixed(1)}`)
    .join(" ");

  const areaD = pathD + ` L ${w} ${h} L 0 ${h} Z`;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * w;
      const idx = Math.round(x / step);
      setHoverIdx(Math.max(0, Math.min(points.length - 1, idx)));
    },
    [step, points.length]
  );

  return (
    <PanelShell label="net" labelRight="enp0s31f6" delay={delay}>
      <div ref={ref} className="px-5 py-4">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full cursor-crosshair"
          style={{ height: 90 }}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--signal-green)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--signal-green)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#netFill)" />
          <path d={pathD} fill="none" stroke="var(--signal-green)" strokeWidth="1.5" strokeOpacity="0.55" />

          {/* Hover crosshair */}
          {hoverIdx !== null && (
            <>
              <line
                x1={hoverIdx * step}
                y1={0}
                x2={hoverIdx * step}
                y2={h}
                stroke="var(--accent)"
                strokeWidth="1"
                strokeOpacity="0.3"
                strokeDasharray="3,3"
              />
              <circle
                cx={hoverIdx * step}
                cy={h - (points[hoverIdx] / 100) * h}
                r="3"
                fill="var(--accent)"
                fillOpacity="0.7"
              />
              <text
                x={hoverIdx * step + (hoverIdx > points.length / 2 ? -8 : 8)}
                y={h - (points[hoverIdx] / 100) * h - 8}
                fill="var(--accent)"
                fontSize="9"
                fontFamily={mono}
                textAnchor={hoverIdx > points.length / 2 ? "end" : "start"}
                fillOpacity="0.8"
              >
                {((points[hoverIdx] / 100) * 8.5).toFixed(1)} MiB/s
              </text>
            </>
          )}
        </svg>
        <div
          className="flex items-center justify-between mt-3 text-muted-foreground/35"
          style={{ fontSize: "0.6875rem" }}
        >
          <span>
            <span style={{ color: "var(--signal-green)", opacity: 0.7 }}>▼</span> 4.20 MiB/s
          </span>
          <span>
            <span style={{ color: "var(--signal-red)", opacity: 0.6 }}>▲</span> 1.22 MiB/s
          </span>
        </div>
      </div>
    </PanelShell>
  );
}

// ─── Process Table with row hover ──────────────────────────────────

export function ProcessTable({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [hoveredPid, setHoveredPid] = useState<number | null>(null);

  const procs = [
    { pid: 3997824, name: "gradle-daemon", args: "--build --daemon", threads: 42, cpu: 8.3, mem: 1.1 },
    { pid: 3904755, name: "kotlin-compile", args: "compileKotlin", threads: 12, cpu: 6.7, mem: 0.8 },
    { pid: 954079, name: "android-studio", args: "--ide", threads: 81, cpu: 2.7, mem: 3.2 },
    { pid: 3533263, name: "adb", args: "server fork", threads: 3, cpu: 0.1, mem: 0.4 },
    { pid: 31968, name: "ghostty", args: "--config=default", threads: 4, cpu: 0.4, mem: 0.3 },
    { pid: 3904274, name: "node", args: "vite dev", threads: 8, cpu: 1.4, mem: 0.8 },
  ];

  return (
    <PanelShell label="proc" delay={delay}>
      <div ref={ref}>
        {/* Options row */}
        <div
          className="flex items-center justify-end gap-5 px-5 py-1.5 text-muted-foreground/25"
          style={{ fontSize: "0.625rem", borderBottom: "1px solid var(--border)" }}
        >
          {["filter", "tree", "per-core"].map((opt) => (
            <motion.span
              key={opt}
              className="cursor-pointer hover:text-accent transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {opt}
            </motion.span>
          ))}
        </div>
        {/* Column headers */}
        <div
          className="grid px-5 py-2 text-muted-foreground/35"
          style={{
            gridTemplateColumns: "80px 1fr 1fr 52px 52px 52px",
            borderBottom: "1px solid var(--border)",
            fontSize: "0.6875rem",
            fontWeight: 500,
          }}
        >
          <span>Pid</span>
          <span>Program</span>
          <span>Arguments</span>
          <span className="text-right">Thrd</span>
          <span className="text-right">Cpu%</span>
          <span className="text-right">Mem%</span>
        </div>
        {/* Rows */}
        <div className="px-5 py-2">
          {procs.map((p, i) => (
            <motion.div
              key={p.pid}
              className="grid py-[5px] -mx-2 px-2 cursor-default"
              style={{
                gridTemplateColumns: "80px 1fr 1fr 52px 52px 52px",
                fontSize: "0.6875rem",
                borderRadius: "3px",
                backgroundColor: hoveredPid === p.pid ? "rgba(139, 124, 246, 0.06)" : "transparent",
                transition: "background-color 0.15s ease",
              }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.1 + i * 0.04 }}
              onMouseEnter={() => setHoveredPid(p.pid)}
              onMouseLeave={() => setHoveredPid(null)}
            >
              <span className="text-muted-foreground/25">{p.pid}</span>
              <span
                style={{
                  color: p.cpu > 5 ? "var(--signal-green)" : "var(--foreground)",
                  opacity: p.cpu > 5 ? 0.7 : 0.35,
                  fontWeight: p.cpu > 5 ? 500 : 400,
                }}
              >
                {p.name}
              </span>
              <span className="text-muted-foreground/25 truncate">{p.args}</span>
              <span className="text-right text-muted-foreground/30">{p.threads}</span>
              <span
                className="text-right"
                style={{ color: barColor(p.cpu * 10), opacity: 0.6, fontWeight: 500 }}
              >
                {p.cpu.toFixed(1)}
              </span>
              <span className="text-right text-muted-foreground/35">{p.mem.toFixed(1)}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

// ─── Uptime / Status Strip — live ticking ──────────────────────────

export function UptimeStrip({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [uptime, setUptime] = useState({ d: 47, h: 6, m: 23 });

  useEffect(() => {
    const id = setInterval(() => {
      setUptime((prev) => {
        let m = prev.m + 1;
        let h = prev.h;
        let d = prev.d;
        if (m >= 60) { m = 0; h++; }
        if (h >= 24) { h = 0; d++; }
        return { d, h, m };
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      ref={ref}
      className="flex flex-wrap items-center gap-x-7 gap-y-2 px-2 py-2"
      style={{ fontFamily: mono, fontSize: "0.6875rem" }}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.5, delay, ease }}
    >
      <span className="flex items-center gap-2">
        <span
          className="w-[6px] h-[6px] rounded-full"
          style={{ backgroundColor: "var(--signal-green)", animation: "pulse-scale 3s ease-in-out infinite" }}
        />
        <span className="text-muted-foreground/40">up {uptime.d}d {uptime.h}h {uptime.m}m</span>
      </span>
      {[
        "load 1.47 1.22 0.98",
        "tasks 406",
        "thr 1,247",
        "mem 37%",
      ].map((item) => (
        <motion.span
          key={item}
          className="text-muted-foreground/25 cursor-default"
          whileHover={{ color: "var(--foreground)", opacity: 0.5 }}
          transition={{ duration: 0.2 }}
        >
          {item}
        </motion.span>
      ))}
    </motion.div>
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
    <PanelShell label="disks" labelRight="+94K" delay={delay}>
      <div ref={ref} className="px-5 py-3.5 space-y-2">
        {disks.map((d, i) => {
          const pct = Math.round((d.used / d.total) * 100);
          return (
            <motion.div
              key={d.label}
              className="flex items-center gap-3 -mx-1 px-1 py-[1px] hover:bg-accent/[0.04] transition-colors duration-150"
              style={{ fontSize: "0.6875rem", borderRadius: "3px" }}
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
  );
}

// ─── CPU Heat-map Grid with cell hover ─────────────────────────────

export function CpuGraph({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const rng = seeded(99);

  const cols = 36;
  const rows = 8;
  const grid = useMemo(() => {
    const g: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: number[] = [];
      let val = rng() * 40 + 10;
      for (let c = 0; c < cols; c++) {
        val += (rng() - 0.45) * 25;
        val = Math.max(0, Math.min(100, val));
        row.push(val);
      }
      g.push(row);
    }
    return g;
  }, []);

  return (
    <PanelShell label="cpu history" labelRight="6 cores · 3.7 GHz" delay={delay}>
      <div ref={ref} className="px-5 py-4 relative">
        <div className="flex flex-col gap-[3px]">
          {grid.map((row, r) => (
            <div key={r} className="flex gap-[3px]">
              {row.map((val, c) => {
                const baseOpacity = Math.max(0.06, val / 100) * 0.8;
                const color =
                  val > 75
                    ? "var(--signal-red)"
                    : val > 40
                    ? "var(--signal-yellow)"
                    : "var(--signal-green)";
                const isHovered = hoveredCell?.r === r && hoveredCell?.c === c;
                return (
                  <motion.span
                    key={c}
                    className="inline-block cursor-crosshair"
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      backgroundColor: color,
                      opacity: isHovered ? 1 : baseOpacity,
                      transition: "opacity 0.1s ease",
                      boxShadow: isHovered ? `0 0 6px ${color}` : "none",
                    }}
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: baseOpacity } : {}}
                    transition={{ duration: 0.15, delay: delay + 0.04 + c * 0.006 + r * 0.015 }}
                    onMouseEnter={() => setHoveredCell({ r, c })}
                    onMouseLeave={() => setHoveredCell(null)}
                    title={`Core ${r + 1} · ${val.toFixed(0)}%`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {/* Hover value display */}
        {hoveredCell && (
          <div
            className="absolute top-2 right-5 text-muted-foreground/50"
            style={{ fontSize: "0.625rem" }}
          >
            Core {hoveredCell.r + 1} · {grid[hoveredCell.r][hoveredCell.c].toFixed(0)}%
          </div>
        )}
      </div>
    </PanelShell>
  );
}

// ─── Composed layouts ──────────────────────────────────────────────

export function SystemSidebar({ delay = 0 }: { delay?: number }) {
  return (
    <div className="space-y-4">
      <CpuMonitor delay={delay} />
      <MemoryPanel delay={delay + 0.08} />
      <DiskBars delay={delay + 0.16} />
    </div>
  );
}

export function SystemBottomBar({ delay = 0 }: { delay?: number }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NetworkGraph delay={delay} />
        <CpuGraph delay={delay + 0.05} />
      </div>
      <ProcessTable delay={delay + 0.1} />
    </div>
  );
}
