import { m } from "motion/react";
import { useState, useEffect } from "react";
import { useInView } from "@/hooks/useInView";
import { Em } from "@/components/Terminal";
import { Shell } from "./Shell";
import { useCopy } from "./_helpers";
import type { CommitSummary } from "@/pages/api/github/commits";
import { ease } from "@/lib/motion";

// Rows the panel always reserves: /api/github/commits returns at most this many,
// so the panel keeps one height while loading, when loaded and when the feed is down.
const COMMIT_ROWS = 5;
const ROW_CLASS = "flex items-baseline gap-3 py-[3px] -mx-2 px-2 text-mono-sm rounded-[2px]";

export function RealGitLog({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [commits, setCommits] = useState<CommitSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const { copy } = useCopy();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/github/commits")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: unknown) => {
        const list = Array.isArray(data) ? (data as CommitSummary[]).slice(0, COMMIT_ROWS) : [];
        setCommits(list);
        setStatus(list.length > 0 ? "ready" : "unavailable");
      })
      .catch((err) => {
        console.warn("[RealGitLog] Failed to fetch commits:", err);
        setStatus("unavailable");
      });
  }, []);

  const fillers = COMMIT_ROWS - commits.length;

  return (
    <Shell
      delay={delay}
      command={<>git log <Em>--oneline</Em> --decorate -5</>}
      windowTitle="git — log"
    >
      {() => (
        <div ref={ref} className="space-y-0">
          {commits.map((c, i) => (
            <m.div
              key={c.hash}
              className={ROW_CLASS}
              style={{
                lineHeight: 1.7,
                transition: "background-color 0.15s ease",
              }}
              initial={{ opacity: 0, x: -4 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.08 + i * 0.04, ease }}
              whileHover={{ backgroundColor: "var(--muted)" }}
            >
              <span
                className="text-muted-foreground cursor-pointer shrink-0 text-mono-sm"
                role="button"
                tabIndex={0}
                onClick={() => {
                  copy(c.hash);
                  setCopiedHash(c.hash);
                  setTimeout(() => setCopiedHash(null), 1500);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (e.key === " ") e.preventDefault();
                    copy(c.hash);
                    setCopiedHash(c.hash);
                    setTimeout(() => setCopiedHash(null), 1500);
                  }
                }}
                title="Copy hash"
                aria-label="Copy commit hash"
              >
                {copiedHash === c.hash ? "copied!" : c.hash}
              </span>
              <span className="text-foreground/75 flex-1 truncate">{c.msg}</span>
              <span className="text-muted-foreground shrink-0 text-label">
                {c.date}
              </span>
            </m.div>
          ))}
          {/* Filler rows keep the reserved height; the first says why it is empty. */}
          {Array.from({ length: fillers }, (_, i) => (
            <div key={`filler-${i}`} className={`${ROW_CLASS} text-muted-foreground`} style={{ lineHeight: 1.7 }}>
              {i === 0 && status === "unavailable" ? "commit feed unavailable" : "\u00a0"}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
