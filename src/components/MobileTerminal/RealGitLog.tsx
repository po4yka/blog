import { m } from "motion/react";
import { useState, useEffect } from "react";
import { useInView } from "@/hooks/useInView";
import { Em } from "@/components/Terminal";
import { Shell } from "./Shell";
import { useCopy } from "./_helpers";
import type { CommitSummary } from "@/pages/api/github/commits";
import { useLocale } from "@/stores/settingsStore";
import { duration, ease, stagger } from "@/lib/motion";

// Rows the panel always reserves: /api/github/commits returns at most this many,
// so the panel keeps one height while loading, when loaded and when the feed is down.
const COMMIT_ROWS = 5;
const ROW_CLASS = "flex items-baseline gap-3 py-[3px] -mx-2 px-2 text-mono-sm rounded-[2px]";

export function RealGitLog({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [commits, setCommits] = useState<CommitSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const { t } = useLocale();
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

  const copyHash = (hash: string) => {
    copy(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const fillers = COMMIT_ROWS - commits.length;

  return (
    <Shell
      delay={delay}
      command={<>git log <Em>--oneline</Em> --decorate -5</>}
      windowTitle="git — log"
    >
      {() => (
        <div ref={ref} className="space-y-0">
          <span role="status" className="sr-only">
            {copiedHash ? t("terminal.hashCopied") : ""}
          </span>
          {commits.map((c, i) => (
            <m.div
              key={c.hash}
              className={ROW_CLASS}
              style={{ lineHeight: 1.7 }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: duration.base, delay: delay + i * stagger.fast, ease }}
              // Hover has its own timing, so it does not wait out the entrance delay.
              whileHover={{ backgroundColor: "var(--muted)", transition: { duration: duration.fast, delay: 0 } }}
            >
              {/* min-w fits the copied label so the row does not shift; the ::after hit area
                  gives a 44px target on touch without changing the row height. */}
              <button
                type="button"
                className="relative min-w-[11ch] text-left text-muted-foreground cursor-pointer shrink-0 text-mono-sm [@media(pointer:coarse)]:after:absolute [@media(pointer:coarse)]:after:inset-x-0 [@media(pointer:coarse)]:after:-inset-y-3 [@media(pointer:coarse)]:after:content-['']"
                onClick={() => copyHash(c.hash)}
              >
                {copiedHash === c.hash ? t("terminal.hashCopied") : c.hash}
                <span className="sr-only">, {t("terminal.copyHash")}</span>
              </button>
              <span className="text-foreground/75 flex-1 truncate">{c.msg}</span>
              <span className="text-muted-foreground shrink-0 text-label">
                {c.date}
              </span>
            </m.div>
          ))}
          {/* Filler rows keep the reserved height; the first says why it is empty. */}
          {Array.from({ length: fillers }, (_, i) => (
            <div key={`filler-${i}`} className={`${ROW_CLASS} text-muted-foreground`} style={{ lineHeight: 1.7 }}>
              {i === 0 && status === "unavailable" ? t("terminal.commitFeedUnavailable") : "\u00a0"}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
