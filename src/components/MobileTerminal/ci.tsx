import { motion } from "motion/react";
import { useState } from "react";
import { Accent } from "@/components/Terminal";
import { Shell } from "./Shell";
import { useCopy } from "./_helpers";

// --- fastlane deploy ---

export function FastlaneDeploy({ delay = 0 }: { delay?: number }) {
  const lanes = [
    { step: "Ensuring clean git status", icon: "\u2713", color: "var(--ok)" },
    { step: "Running unit tests (436 passed)", icon: "\u2713", color: "var(--ok)" },
    { step: "Incrementing build number \u2192 247", icon: "\u2713", color: "var(--ok)" },
    { step: "Building release APK", icon: "\u2713", color: "var(--ok)" },
    { step: "Building release IPA", icon: "\u2713", color: "var(--ok)" },
    { step: "Uploading to Google Play (internal)", icon: "\u2713", color: "var(--ok)" },
    { step: "Uploading to TestFlight", icon: "\u2713", color: "var(--ok)" },
    { step: "Posting Slack notification", icon: "\u2713", color: "var(--ok)" },
  ];

  return (
    <Shell
      delay={delay}
      command={<>fastlane <Accent>deploy</Accent> --env production</>}
      windowTitle="fastlane — deploy"
    >
      {({ inView }) => (
        <>
          <motion.div
            className="text-muted-foreground/25 pb-3 text-label"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.08 }}
          >
            [19:42:08]: Driving the lane 'deploy'
          </motion.div>

          {lanes.map((lane, i) => (
            <motion.div
              key={lane.step}
              className="flex items-baseline gap-3 py-[3px] -mx-2 px-2 hover:bg-accent/[0.03] transition-colors duration-150 text-mono rounded-[4px]"
              style={{ lineHeight: 1.7 }}
              initial={{ opacity: 0, x: -4 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.12 + i * 0.04 }}
            >
              <motion.span
                className="font-medium"
                style={{ color: lane.color, opacity: 0.8 }}
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                {lane.icon}
              </motion.span>
              <span className="text-foreground/75">{lane.step}</span>
            </motion.div>
          ))}

          <motion.div
            className="pt-3 mt-3 space-y-1 text-mono"
            style={{ borderTop: "1px solid var(--border)" }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.5 }}
          >
            <div className="text-foreground/50">
              <span style={{ color: "var(--ok)", opacity: 0.8 }}>fastlane.tools finished successfully</span>
            </div>
            <div className="text-muted-foreground/30 text-mono-sm">
              Duration: 4 minutes 12 seconds · Build #247
            </div>
          </motion.div>
        </>
      )}
    </Shell>
  );
}

// --- git log --oneline -- click hash to copy ---

export function GitLog({ delay = 0 }: { delay?: number }) {
  const { copiedText, copy } = useCopy();
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);

  const commits = [
    { hash: "a3f8c21", msg: "fix: resolve KMP expect/actual mismatch on iOS", tag: null, time: "2h ago" },
    { hash: "e91b047", msg: "feat: add biometric auth flow for Android + iOS", tag: "v2.4.0", time: "5h ago" },
    { hash: "7cd2f19", msg: "ci: split Play Store upload into separate lane", tag: null, time: "8h ago" },
    { hash: "1a4e3b8", msg: "refactor: migrate Dagger \u2192 Koin for shared module", tag: null, time: "1d ago" },
    { hash: "f62d0c5", msg: "chore: bump AGP to 8.7.0, Kotlin to 2.1.0", tag: null, time: "1d ago" },
    { hash: "b88a41e", msg: "fix: memory leak in image cache on low-end devices", tag: "v2.3.1", time: "2d ago" },
    { hash: "2c90f7d", msg: "feat: offline-first sync with Room + Ktor", tag: null, time: "3d ago" },
  ];

  return (
    <Shell
      delay={delay}
      command={<>git log <Accent>--oneline</Accent> --decorate -7</>}
      windowTitle="git — log"
      dimLights
    >
      {({ inView }) => (
        <>
          {commits.map((c, i) => (
            <motion.div
              key={c.hash}
              className="flex items-baseline gap-3 py-[3px] -mx-2 px-2 text-mono rounded-[4px]"
              style={{
                lineHeight: 1.7,
                backgroundColor: hoveredHash === c.hash ? "var(--accent-4)" : "transparent",
                transition: "background-color 0.15s ease",
              }}
              initial={{ opacity: 0, x: -4 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.08 + i * 0.04 }}
              onMouseEnter={() => setHoveredHash(c.hash)}
              onMouseLeave={() => setHoveredHash(null)}
            >
              <motion.span
                className="cursor-pointer select-none text-mono-sm"
                style={{
                  color: copiedText === c.hash ? "var(--accent)" : "var(--signal-yellow)",
                  opacity: hoveredHash === c.hash ? 0.9 : 0.6,
                  transition: "opacity 0.15s ease",
                }}
                onClick={() => copy(c.hash)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Click to copy hash"
              >
                {copiedText === c.hash ? "copied!" : c.hash}
              </motion.span>
              {c.tag && (
                <motion.span
                  className="shrink-0 px-1.5 py-0 text-xs rounded-[3px] font-medium"
                  style={{
                    color: "var(--accent)",
                    backgroundColor: "var(--accent-10)",
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  {c.tag}
                </motion.span>
              )}
              <span className="text-foreground/75 flex-1">{c.msg}</span>
              <span className="text-muted-foreground/25 shrink-0 text-label">
                {c.time}
              </span>
            </motion.div>
          ))}
        </>
      )}
    </Shell>
  );
}
