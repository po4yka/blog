import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useInView } from "@/hooks/useInView";
import { Accent } from "@/components/Terminal";
import { Shell } from "./Shell";
import type { ActionsSummary } from "@/pages/api/github/actions";
import { ease } from "@/lib/motion";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem > 0 ? `${min}m ${rem}s` : `${min}m`;
}

function statusIcon(conclusion: string | null, status: string): { icon: string; color: string } {
  if (status === "in_progress") return { icon: "...", color: "var(--signal-amber)" };
  if (status === "queued") return { icon: "~", color: "var(--muted-foreground)" };
  switch (conclusion) {
    case "success": return { icon: "\u2713", color: "var(--ok)" };
    case "failure": return { icon: "\u2717", color: "var(--signal-red)" };
    case "cancelled": return { icon: "\u2013", color: "var(--muted-foreground)" };
    default: return { icon: "?", color: "var(--muted-foreground)" };
  }
}

export function RealCIStatus({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [runs, setRuns] = useState<ActionsSummary[]>([]);

  useEffect(() => {
    fetch("/api/github/actions")
      .then((r) => r.json())
      .then((data: ActionsSummary[]) => setRuns(data))
      .catch(() => {});
  }, []);

  if (runs.length === 0) return null;

  return (
    <Shell
      delay={delay}
      command={<>gh run list <Accent>--limit 5</Accent></>}
      windowTitle="ci — actions"
      dimLights
    >
      {() => (
        <div ref={ref} className="space-y-0">
          {runs.map((run, i) => {
            const { icon, color } = statusIcon(run.conclusion, run.status);
            return (
              <motion.a
                key={run.runNumber}
                href={run.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-baseline gap-3 py-[3px] -mx-2 px-2 text-mono rounded-[4px] no-underline"
                style={{ lineHeight: 1.7, transition: "background-color 0.15s ease" }}
                initial={{ opacity: 0, x: -4 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.25, delay: delay + 0.08 + i * 0.04, ease }}
                whileHover={{ backgroundColor: "var(--accent-4)" }}
              >
                <span className="shrink-0 font-medium" style={{ color, opacity: 0.8 }}>
                  {icon}
                </span>
                <span className="text-foreground/75 flex-1 truncate group-hover:text-foreground/70 transition-colors duration-150">
                  {run.name}
                </span>
                <span className="text-accent/50 text-label shrink-0">
                  {run.branch}
                </span>
                {run.durationSec != null && (
                  <span className="text-muted-foreground/30 text-label shrink-0">
                    {formatDuration(run.durationSec)}
                  </span>
                )}
                <span className="text-muted-foreground/25 text-label shrink-0">
                  {relativeTime(run.date)}
                </span>
              </motion.a>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
