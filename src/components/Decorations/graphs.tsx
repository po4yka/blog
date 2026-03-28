import { motion } from "motion/react";
import { useInView } from "../useInView";
import { useState, useEffect, useMemo, useCallback } from "react";
import { MotionProvider } from "../MotionProvider";
import { seeded, barColor, PanelShell } from "./_helpers";

// ─── Network Sparkline with hover crosshair ────────────────────────

export function NetworkGraph({ delay = 0 }: { delay?: number }) {
  const { ref } = useInView(0.1);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const rng = seeded(77);

  /* eslint-disable react-hooks/exhaustive-deps */
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
  /* eslint-enable react-hooks/exhaustive-deps */

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
    <MotionProvider>
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
                cy={h - ((points[hoverIdx] ?? 0) / 100) * h}
                r="3"
                fill="var(--accent)"
                fillOpacity="0.7"
              />
              <text
                x={hoverIdx * step + (hoverIdx > points.length / 2 ? -8 : 8)}
                y={h - ((points[hoverIdx] ?? 0) / 100) * h - 8}
                fill="var(--accent)"
                fontSize="9"
                className="font-mono"
                textAnchor={hoverIdx > points.length / 2 ? "end" : "start"}
                fillOpacity="0.8"
              >
                {(((points[hoverIdx] ?? 0) / 100) * 8.5).toFixed(1)} MiB/s
              </text>
            </>
          )}
        </svg>
        <div
          className="flex items-center justify-between mt-3 text-muted-foreground/35 text-label"
        >
          <span>
            <span style={{ color: "var(--signal-green)", opacity: 0.7 }}>&#x25BC;</span> 4.20 MiB/s
          </span>
          <span>
            <span style={{ color: "var(--signal-red)", opacity: 0.6 }}>&#x25B2;</span> 1.22 MiB/s
          </span>
        </div>
      </div>
    </PanelShell>
    </MotionProvider>
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
    <MotionProvider>
    <PanelShell label="proc" delay={delay}>
      <div ref={ref}>
        {/* Options row */}
        <div
          className="flex items-center justify-end gap-5 px-5 py-1.5 text-muted-foreground/25 text-xs"
          style={{ borderBottom: "1px solid var(--border)" }}
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
          className="grid px-5 py-2 text-muted-foreground/35 text-label font-medium"
          style={{
            gridTemplateColumns: "80px 1fr 1fr 52px 52px 52px",
            borderBottom: "1px solid var(--border)",
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
              className="grid py-[5px] -mx-2 px-2 cursor-default text-label rounded-[3px]"
              style={{
                gridTemplateColumns: "80px 1fr 1fr 52px 52px 52px",
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
                className="text-right font-medium"
                style={{ color: barColor(p.cpu * 10), opacity: 0.6 }}
              >
                {p.cpu.toFixed(1)}
              </span>
              <span className="text-right text-muted-foreground/35">{p.mem.toFixed(1)}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </PanelShell>
    </MotionProvider>
  );
}

// ─── CPU Heat-map Grid with cell hover ─────────────────────────────

export function CpuGraph({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const rng = seeded(99);

  const cols = 36;
  const rows = 8;
  /* eslint-disable react-hooks/exhaustive-deps */
  const baseGrid = useMemo(() => {
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
  /* eslint-enable react-hooks/exhaustive-deps */

  // Periodic wave: slightly shift opacity values every 12s
  const [waveOffsets, setWaveOffsets] = useState<number[][]>(() =>
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setWaveOffsets(
        Array.from({ length: rows }, () =>
          Array.from({ length: cols }, () => (Math.random() - 0.5) * 0.15)
        )
      );
    }, 12_000);
    return () => clearInterval(id);
  }, []);

  return (
    <MotionProvider>
    <PanelShell label="cpu history" labelRight="6 cores · 3.7 GHz" delay={delay}>
      <div ref={ref} className="px-5 py-4 relative">
        <div className="flex flex-col gap-[3px]">
          {baseGrid.map((row, r) => (
            <div key={r} className="flex gap-[3px]">
              {row.map((val, c) => {
                const baseOpacity = Math.max(0.06, val / 100) * 0.8;
                const waveOpacity = Math.max(0.04, Math.min(0.9, baseOpacity + (waveOffsets[r]?.[c] ?? 0)));
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
                    className="inline-block cursor-crosshair rounded-sm"
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: color,
                      opacity: isHovered ? 1 : waveOpacity,
                      transition: "opacity 1.5s ease",
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
            className="absolute top-2 right-5 text-muted-foreground/50 text-xs"
          >
            Core {hoveredCell.r + 1} · {(baseGrid[hoveredCell.r]?.[hoveredCell.c] ?? 0).toFixed(0)}%
          </div>
        )}
      </div>
    </PanelShell>
    </MotionProvider>
  );
}
