import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useInView } from "@/hooks/useInView";
import { MotionProvider } from "@/components/MotionProvider";
import { PanelShell } from "./_helpers";
import type { GitHubActivitySummary } from "@/types";

function SparkBar({
  pct,
  delay,
  inView,
}: {
  pct: number;
  delay: number;
  inView: boolean;
}) {
  return (
    <div className="flex items-end" style={{ width: "14px", height: "36px" }}>
      <motion.div
        style={{
          width: "10px",
          borderRadius: "2px 2px 0 0",
          backgroundColor: pct > 0 ? "var(--accent)" : "var(--border)",
          opacity: pct > 0 ? 0.4 + pct * 0.004 : 0.2,
          minHeight: "2px",
        }}
        initial={{ height: 0 }}
        animate={inView ? { height: `${Math.max(4, pct * 0.36)}px` } : { height: 0 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
      />
    </div>
  );
}

export function ActivitySparkline({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [data, setData] = useState<GitHubActivitySummary | null>(null);

  useEffect(() => {
    fetch("/api/github/events")
      .then((r) => r.json())
      .then((d: GitHubActivitySummary) => setData(d))
      .catch(() => {});
  }, []);

  const buckets = data?.buckets ?? Array(14).fill(0);
  const maxBucket = Math.max(...buckets, 1);
  const normalizedPcts = buckets.map((b) => Math.round((b / maxBucket) * 100));
  const labelRight = data
    ? `14d · ${data.total} events`
    : "14d";

  return (
    <MotionProvider>
      <PanelShell label="activity" labelRight={labelRight} delay={delay}>
        <div ref={ref} className="px-5 py-4">
          <div className="flex items-end gap-[2px]">
            {normalizedPcts.map((pct, i) => (
              <SparkBar
                key={i}
                pct={pct}
                delay={delay + 0.1 + i * 0.03}
                inView={inView}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-muted-foreground/25 text-label">
            <span>13d ago</span>
            <span>today</span>
          </div>
        </div>
        <div
          className="flex items-center px-5 py-2 text-muted-foreground/25 text-xs"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span>github.com/{"{"}po4yka{"}"}/events</span>
        </div>
      </PanelShell>
    </MotionProvider>
  );
}
