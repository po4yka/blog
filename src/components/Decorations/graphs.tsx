import { motion, AnimatePresence } from "motion/react";
import { useInView } from "@/hooks/useInView";
import { useState, useCallback, useEffect } from "react";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell } from "./_helpers";
import { createSeededRng, barColor } from "./_utils";
import { useActivityStore } from "@/stores/activityStore";
import { useAnimationInterval } from "@/hooks/useAnimationInterval";

// --- Network Sparkline with hover crosshair ---

const NETWORK_GRAPH_POINT_COUNT = 64;
const CPU_GRAPH_COLS = 36;
const CPU_GRAPH_ROWS = 8;

function createNetworkGraphPoints() {
  const random = createSeededRng(77);
  const points: number[] = [];
  let value = 30;

  for (let index = 0; index < NETWORK_GRAPH_POINT_COUNT; index++) {
    value += (random() - 0.45) * 18;
    value = Math.max(5, Math.min(95, value));
    points.push(value);
  }

  return points;
}

function createCpuBaseGrid() {
  const random = createSeededRng(99);
  const grid: number[][] = [];

  for (let row = 0; row < CPU_GRAPH_ROWS; row++) {
    const values: number[] = [];
    let value = random() * 40 + 10;

    for (let column = 0; column < CPU_GRAPH_COLS; column++) {
      value += (random() - 0.45) * 25;
      value = Math.max(0, Math.min(100, value));
      values.push(value);
    }

    grid.push(values);
  }

  return grid;
}

export function NetworkGraph({ delay = 0 }: { delay?: number }) {
  const { ref } = useInView(0.1);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [points, setPoints] = useState(createNetworkGraphPoints);

  // Sliding window driven by scroll velocity. Updates on a 3s cycle
  // per Guidelines ("CPU/memory panels update on 3-10s cycles, not every
  // frame") so the graph reads as an ambient atmospheric widget rather
  // than continuous animation.
  useAnimationInterval(() => {
    const { scrollVelocity } = useActivityStore.getState();
    const newPoint = Math.max(5, Math.min(95,
      scrollVelocity * 70 + Math.random() * 15 + 5,
    ));
    setPoints((prev) => [...prev.slice(1), newPoint]);
  }, 3000);

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
          style={{ height: "clamp(60px, 15vw, 90px)" }}
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
            <span style={{ color: "var(--signal-green)", opacity: 0.7 }}>&#x25BC;</span>{" "}
            {(((points[points.length - 1] ?? 0) / 100) * 8.5).toFixed(2)} MiB/s
          </span>
          <span>
            <span style={{ color: "var(--signal-red)", opacity: 0.6 }}>&#x25B2;</span>{" "}
            {(((points[points.length - 1] ?? 0) / 100) * 2.1).toFixed(2)} MiB/s
          </span>
        </div>
      </div>
    </PanelShell>
    </MotionProvider>
  );
}

// --- Process Table with row hover ---

interface Proc {
  pid: number;
  name: string;
  args: string;
  threads: number;
  cpu: number;
  mem: number;
}

const baseProcs: Proc[] = [
  { pid: 3997824, name: "gradle-daemon", args: "--build --daemon", threads: 42, cpu: 8.3, mem: 1.1 },
  { pid: 3904755, name: "kotlin-compile", args: "compileKotlin", threads: 12, cpu: 6.7, mem: 0.8 },
  { pid: 954079, name: "android-studio", args: "--ide", threads: 81, cpu: 2.7, mem: 3.2 },
  { pid: 3533263, name: "adb", args: "server fork", threads: 3, cpu: 0.1, mem: 0.4 },
  { pid: 31968, name: "ghostty", args: "--config=default", threads: 4, cpu: 0.4, mem: 0.3 },
  { pid: 3904274, name: "node", args: "vite dev", threads: 8, cpu: 1.4, mem: 0.8 },
];

const sectionProcs: Record<string, { name: string; args: string; threads: number }> = {
  hero: { name: "hero-render", args: "layout --hydrate", threads: 6 },
  about: { name: "about-layout", args: "render markdown", threads: 2 },
  projects: { name: "project-index", args: "compile --list", threads: 4 },
  experience: { name: "exp-renderer", args: "timeline build", threads: 3 },
  blog: { name: "blog-preview", args: "mdx --parse", threads: 5 },
};

/** Deterministic pid from section name */
function sectionPid(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 9000000 + 1000000;
}

export function ProcessTable({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [hoveredPid, setHoveredPid] = useState<number | null>(null);
  const [procs, setProcs] = useState<Proc[]>(baseProcs);

  // Update process list based on visible sections
  useAnimationInterval(() => {
    const { visibleSectionNames } = useActivityStore.getState();
    const sectionRows: Proc[] = visibleSectionNames
      .filter((name) => name in sectionProcs)
      .map((name) => {
        const sp = sectionProcs[name]!;
        return {
          pid: sectionPid(name),
          name: sp.name,
          args: sp.args,
          threads: sp.threads,
          cpu: +(3 + Math.random() * 5).toFixed(1),
          mem: +(0.2 + Math.random() * 0.6).toFixed(1),
        };
      });

    const merged = [...baseProcs, ...sectionRows]
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 8);

    setProcs(merged);
  }, 2000);

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
          <AnimatePresence mode="popLayout">
            {procs.map((p) => (
              <motion.div
                key={p.pid}
                layout
                className="grid py-[5px] -mx-2 px-2 cursor-default text-label rounded-[3px]"
                style={{
                  gridTemplateColumns: "80px 1fr 1fr 52px 52px 52px",
                  backgroundColor: hoveredPid === p.pid ? "rgba(145, 132, 247, 0.06)" : "transparent",
                  transition: "background-color 0.15s ease",
                }}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
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
          </AnimatePresence>
        </div>
      </div>
    </PanelShell>
    </MotionProvider>
  );
}

// --- CPU Heat-map Grid with cell hover ---

export function CpuGraph({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [baseGrid] = useState(createCpuBaseGrid);

  // Periodic wave: slightly shift opacity values every 12s
  const [waveOffsets, setWaveOffsets] = useState<number[][]>(() =>
    Array.from({ length: CPU_GRAPH_ROWS }, () =>
      Array.from({ length: CPU_GRAPH_COLS }, () => 0)
    )
  );

  useAnimationInterval(() => {
    const { scrollProgress, scrollVelocity } = useActivityStore.getState();

    const amplitude = 0.15 + scrollVelocity * 0.25;
    const baseShift = scrollProgress * 0.1;

    setWaveOffsets(
      Array.from({ length: CPU_GRAPH_ROWS }, () =>
        Array.from(
          { length: CPU_GRAPH_COLS },
          () => (Math.random() - 0.5) * amplitude + baseShift
        )
      )
    );
  }, 12_000);

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

// --- ConnectionPanel: real browser network data ---
// Sparkline is built from actual resource timing entries captured at page
// load (performance.getEntriesByType('resource')), so every visitor sees
// their own real load profile rather than animated random values.
// Connection stats use the Network Information API (Chrome/Edge/Android);
// falls back to page load time on Safari/Firefox.

interface ConnectionInfo {
  effectiveType: string;
  downlink: number | null;
  rtt: number | null;
}

interface NetworkInformationLike {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

function readConnection(): ConnectionInfo | null {
  if (typeof navigator === "undefined") return null;
  const nav = (
    (navigator as unknown as { connection?: NetworkInformationLike }).connection ??
    (navigator as unknown as { mozConnection?: NetworkInformationLike }).mozConnection ??
    (navigator as unknown as { webkitConnection?: NetworkInformationLike }).webkitConnection
  );
  if (!nav) return null;
  return {
    effectiveType: nav.effectiveType ?? "unknown",
    downlink: nav.downlink ?? null,
    rtt: nav.rtt ?? null,
  };
}

const CONN_POINTS = 64;

function buildResourceSparkline(): number[] {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") return [];
  const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const durations = entries.map((e) => e.duration).filter((d) => d > 0);
  if (durations.length === 0) return [];
  const max = Math.max(...durations);
  const normalized = durations
    .slice(-CONN_POINTS)
    .map((d) => Math.min(100, Math.round((d / max) * 100)));
  return [
    ...Array(Math.max(0, CONN_POINTS - normalized.length)).fill(0),
    ...normalized,
  ];
}

function readPageLoad(): number | null {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") return null;
  const navEntry = performance.getEntriesByType(
    "navigation"
  )[0] as PerformanceNavigationTiming | undefined;
  return navEntry && navEntry.loadEventEnd > 0
    ? Math.round(navEntry.loadEventEnd - navEntry.startTime)
    : null;
}

export function ConnectionPanel({ delay = 0 }: { delay?: number }) {
  const { ref } = useInView(0.1);
  // Start null/empty so SSR and initial client render match, then populate
  // browser-only data in a single effect after hydration.
  const [conn, setConn] = useState<ConnectionInfo | null>(null);
  const [points, setPoints] = useState<number[]>([]);
  const [pageLoad, setPageLoad] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    // Read browser-only APIs once immediately after hydration. These values are
    // intentionally absent during SSR (guards return null/[]), so a single
    // cascading render here is the correct pattern for post-hydration init.
    /* eslint-disable react-hooks/set-state-in-effect */
    setConn(readConnection());
    setPoints(buildResourceSparkline());
    setPageLoad(readPageLoad());
    /* eslint-enable react-hooks/set-state-in-effect */

    // Subscribe to connection changes
    const navConn = (navigator as unknown as { connection?: NetworkInformationLike }).connection;
    if (navConn) {
      const handler = () => setConn(readConnection());
      navConn.addEventListener("change", handler);
      return () => navConn.removeEventListener("change", handler);
    }
  }, []);

  const w = 400;
  const h = 90;
  const step = w / Math.max(points.length - 1, 1);

  const pathD =
    points.length > 1
      ? points
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h - (p / 100) * h).toFixed(1)}`
          )
          .join(" ")
      : "";
  const areaD = pathD ? `${pathD} L ${w} ${h} L 0 ${h} Z` : "";

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * w;
      setHoverIdx(Math.max(0, Math.min(points.length - 1, Math.round(x / step))));
    },
    [step, points.length]
  );

  const labelRight = conn
    ? conn.downlink
      ? `${conn.effectiveType} · ${conn.downlink}Mbps`
      : conn.effectiveType
    : pageLoad != null
    ? `${pageLoad}ms load`
    : undefined;

  return (
    <MotionProvider>
      <PanelShell label="net" labelRight={labelRight} delay={delay}>
        <div ref={ref} className="px-5 py-4">
          {points.length > 0 ? (
            <svg
              viewBox={`0 0 ${w} ${h}`}
              className="w-full cursor-crosshair"
              style={{ height: "clamp(60px, 15vw, 90px)" }}
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id="connFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--signal-green)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--signal-green)" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#connFill)" />
              <path
                d={pathD}
                fill="none"
                stroke="var(--signal-green)"
                strokeWidth="1.5"
                strokeOpacity="0.55"
              />
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
                    {(points[hoverIdx] ?? 0).toFixed(0)}ms
                  </text>
                </>
              )}
            </svg>
          ) : (
            <div
              className="flex items-center justify-center"
              style={{ height: "clamp(60px, 15vw, 90px)" }}
            >
              <span className="text-muted-foreground/20 text-label">—</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-3 text-muted-foreground/35 text-label">
            {conn?.rtt != null ? (
              <>
                <span>rtt {conn.rtt}ms</span>
                {pageLoad != null && <span>load {pageLoad}ms</span>}
              </>
            ) : pageLoad != null ? (
              <span>page loaded in {pageLoad}ms</span>
            ) : (
              <span className="text-muted-foreground/20">—</span>
            )}
          </div>
        </div>
      </PanelShell>
    </MotionProvider>
  );
}
