import { useState, useEffect } from "react";
import { PanelShell } from "./_helpers";
import { useSettings } from "@/stores/settingsStore";

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

function getVisitorInfo(): Omit<VisitorInfo, "theme"> {
  const browser = detectBrowser();
  const os = detectOS();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = window.devicePixelRatio;

  const nav = navigator as Navigator & { connection?: { effectiveType?: string; rtt?: number } };
  const conn = nav.connection;
  const networkType = conn?.effectiveType ?? "unknown";
  const rtt = conn?.rtt != null ? `${conn.rtt}ms rtt` : "";

  return {
    browser: `${browser} / ${os}`,
    viewport: `${w} x ${h} @${dpr}x`,
    network: rtt ? `${networkType} · ${rtt}` : networkType,
  };
}

export function VisitorContext({ delay = 0 }: { delay?: number }) {
  const [info, setInfo] = useState<Omit<VisitorInfo, "theme"> | null>(null);
  // Report the theme actually applied to the page (store-driven), not just the
  // OS preference — a manual dark/light override must show up here truthfully.
  const { theme, resolvedTheme } = useSettings();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time initialization with browser APIs
  useEffect(() => { setInfo(getVisitorInfo()); }, []);

  if (!info) return null;

  const rows = [
    { label: "Browser", value: info.browser },
    { label: "Viewport", value: info.viewport },
    { label: "Theme", value: theme === "system" ? `${resolvedTheme} (system)` : resolvedTheme },
    { label: "Network", value: info.network },
  ];

  return (
    <PanelShell label="VISITOR" labelRight="connected" delay={delay}>
      <div className="px-5 py-3 space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 min-w-0">
            <span className="text-muted-foreground/80 text-mono-sm shrink-0">
              {row.label}
            </span>
            <span className="text-foreground/90 text-mono-sm text-right truncate min-w-0">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
