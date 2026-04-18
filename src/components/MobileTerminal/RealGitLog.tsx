import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useInView } from "@/hooks/useInView";
import { Accent } from "@/components/Terminal";
import { Shell } from "./Shell";
import { useCopy } from "./_helpers";
import type { CommitSummary } from "@/pages/api/github/commits";
import { ease } from "@/lib/motion";

export function RealGitLog({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [commits, setCommits] = useState<CommitSummary[]>([]);
  const { copy } = useCopy();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/github/commits")
      .then((r) => r.json())
      .then((data: CommitSummary[]) => setCommits(data))
      .catch(() => {});
  }, []);

  if (commits.length === 0) return null;

  return (
    <Shell
      delay={delay}
      command={<>git log <Accent>--oneline</Accent> --decorate -7</>}
      windowTitle="git — log"
    >
      {() => (
        <div ref={ref} className="space-y-0">
          {commits.map((c, i) => (
            <motion.div
              key={c.hash}
              className="flex items-baseline gap-3 py-[3px] -mx-2 px-2 text-mono rounded-[2px]"
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
                onClick={() => {
                  copy(c.hash);
                  setCopiedHash(c.hash);
                  setTimeout(() => setCopiedHash(null), 1500);
                }}
                title="Copy hash"
              >
                {copiedHash === c.hash ? "copied!" : c.hash}
              </span>
              <span className="text-foreground/75 flex-1 truncate">{c.msg}</span>
              <span className="text-muted-foreground shrink-0 text-label">
                {c.date}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </Shell>
  );
}
