import { useState, useEffect } from "react";
import { PanelShell } from "./_helpers";

interface VisitorInfo {
  browser: string;
  viewport: string;
  theme: string;
  network: string;
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown";
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}

function getVisitorInfo(): VisitorInfo {
  const browser = detectBrowser();
  const os = detectOS();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = window.devicePixelRatio;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const nav = navigator as Navigator & { connection?: { effectiveType?: string; rtt?: number } };
  const conn = nav.connection;
  const networkType = conn?.effectiveType ?? "unknown";
  const rtt = conn?.rtt != null ? `${conn.rtt}ms rtt` : "";

  return {
    browser: `${browser} / ${os}`,
    viewport: `${w} x ${h} @${dpr}x`,
    theme: prefersDark ? "dark (system)" : "light (system)",
    network: rtt ? `${networkType} · ${rtt}` : networkType,
  };
}

export function VisitorContext({ delay = 0 }: { delay?: number }) {
  const [info, setInfo] = useState<VisitorInfo | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time initialization with browser APIs
  useEffect(() => { setInfo(getVisitorInfo()); }, []);

  if (!info) return null;

  const rows = [
    { label: "Browser", value: info.browser },
    { label: "Viewport", value: info.viewport },
    { label: "Theme", value: info.theme },
    { label: "Network", value: info.network },
  ];

  return (
    <PanelShell label="VISITOR" labelRight="connected" delay={delay}>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <span className="text-muted-foreground/50 text-mono-sm shrink-0">
              {row.label}
            </span>
            <span className="text-foreground/70 text-mono-sm text-right truncate">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
