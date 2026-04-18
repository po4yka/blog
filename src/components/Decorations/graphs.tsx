import { useInView } from "@/hooks/useInView";
import { useState, useCallback, useEffect } from "react";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell } from "./_helpers";

// --- ConnectionPanel: real browser network data ---

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
  const [conn, setConn] = useState<ConnectionInfo | null>(null);
  const [points, setPoints] = useState<number[]>([]);
  const [pageLoad, setPageLoad] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setConn(readConnection());
    setPoints(buildResourceSparkline());
    setPageLoad(readPageLoad());
    /* eslint-enable react-hooks/set-state-in-effect */

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
                  <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#connFill)" />
              <path
                d={pathD}
                fill="none"
                stroke="var(--muted-foreground)"
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
                    stroke="var(--foreground)"
                    strokeWidth="1"
                    strokeOpacity="0.25"
                    strokeDasharray="3,3"
                  />
                  <circle
                    cx={hoverIdx * step}
                    cy={h - ((points[hoverIdx] ?? 0) / 100) * h}
                    r="3"
                    fill="var(--foreground)"
                    fillOpacity="0.6"
                  />
                  <text
                    x={hoverIdx * step + (hoverIdx > points.length / 2 ? -8 : 8)}
                    y={h - ((points[hoverIdx] ?? 0) / 100) * h - 8}
                    fill="var(--foreground)"
                    fontSize="9"
                    className="font-mono"
                    textAnchor={hoverIdx > points.length / 2 ? "end" : "start"}
                    fillOpacity="0.7"
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
              <span className="text-muted-foreground text-label">—</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-3 text-muted-foreground text-label">
            {conn?.rtt != null ? (
              <>
                <span>rtt {conn.rtt}ms</span>
                {pageLoad != null && <span>load {pageLoad}ms</span>}
              </>
            ) : pageLoad != null ? (
              <span>page loaded in {pageLoad}ms</span>
            ) : (
              <span className="text-muted-foreground-dim">—</span>
            )}
          </div>
        </div>
      </PanelShell>
    </MotionProvider>
  );
}
