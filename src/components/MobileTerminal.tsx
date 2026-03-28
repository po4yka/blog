import { motion } from "motion/react";
import { useInView } from "./useInView";
import { useState, useCallback } from "react";
import { Cmd, Accent, MacWindow, OutputBlock } from "./Terminal";
import { MotionProvider } from "./MotionProvider";

const mono = "'JetBrains Mono', monospace";
const ease = [0.25, 0.46, 0.45, 0.94] as const;

/** Small hook for copy-to-clipboard with flash feedback */
function useCopy() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 1200);
    });
  }, []);
  return { copiedText, copy };
}

// ─── adb devices ───────────────────────────────────────────────────

export function AdbDevices({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [hoveredSerial, setHoveredSerial] = useState<string | null>(null);
  const { copiedText, copy } = useCopy();

  const devices = [
    { serial: "emulator-5554", state: "device", model: "Pixel_8_API_35" },
    { serial: "R5CR30LHXVT", state: "device", model: "SM-S928B" },
    { serial: "emulator-5556", state: "device", model: "Medium_Tablet_API_35" },
  ];

  return (
    <MotionProvider>
      <section className="space-y-4">
        <Cmd delay={delay}>
          adb <Accent>devices</Accent> -l
        </Cmd>

        <MacWindow title="adb — devices" dimLights delay={delay + 0.05}>
          <div ref={ref}>
            <motion.div
              className="text-muted-foreground/40 pb-2"
              style={{ fontSize: "0.8125rem" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.08 }}
            >
              List of devices attached
            </motion.div>
            {devices.map((d, i) => (
              <motion.div
                key={d.serial}
                className="flex items-baseline gap-4 py-1 -mx-2 px-2 cursor-pointer"
                style={{
                  fontSize: "0.8125rem",
                  lineHeight: 1.7,
                  borderRadius: "4px",
                  backgroundColor: hoveredSerial === d.serial ? "rgba(139, 124, 246, 0.05)" : "transparent",
                  transition: "background-color 0.15s ease",
                }}
                initial={{ opacity: 0, x: -4 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3, delay: delay + 0.12 + i * 0.05 }}
                onMouseEnter={() => setHoveredSerial(d.serial)}
                onMouseLeave={() => setHoveredSerial(null)}
                onClick={() => copy(d.serial)}
                title="Click to copy serial"
              >
                <span className="text-foreground/60 shrink-0" style={{ minWidth: "140px" }}>
                  {d.serial}
                  {copiedText === d.serial && (
                    <span className="text-accent/60 ml-2" style={{ fontSize: "0.625rem" }}>copied!</span>
                  )}
                </span>
                <span style={{ color: "var(--signal-green)", opacity: 0.7 }}>
                  {d.state}
                </span>
                <span className="text-muted-foreground/35">
                  model:{d.model}
                </span>
              </motion.div>
            ))}
            <motion.div
              className="text-muted-foreground/25 pt-2"
              style={{ fontSize: "0.75rem" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.3 }}
            >
              3 devices connected
            </motion.div>
          </div>
        </MacWindow>
      </section>
    </MotionProvider>
  );
}

// ─── ./gradlew assembleRelease ─────────────────────────────────────

export function GradleBuild({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const tasks = [
    { name: ":app:compileKotlin", status: "ok", time: "12.4s" },
    { name: ":core:compileKotlin", status: "ok", time: "4.1s" },
    { name: ":shared:compileKotlinAndroid", status: "ok", time: "8.7s" },
    { name: ":shared:compileKotlinIosArm64", status: "ok", time: "6.2s" },
    { name: ":app:mergeReleaseResources", status: "ok", time: "1.3s" },
    { name: ":app:packageRelease", status: "ok", time: "3.8s" },
    { name: ":app:assembleRelease", status: "ok", time: "0.2s" },
  ];

  return (
    <MotionProvider>
      <section className="space-y-4">
        <Cmd delay={delay}>
          ./gradlew <Accent>assembleRelease</Accent> --parallel
        </Cmd>

        <MacWindow title="gradle — build" delay={delay + 0.05}>
          <div ref={ref}>
            <motion.div
              className="text-muted-foreground/30 pb-2"
              style={{ fontSize: "0.75rem" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.08 }}
            >
              &gt; Configure project :app
            </motion.div>

            {tasks.map((task, i) => (
              <motion.div
                key={task.name}
                className="flex items-baseline gap-3 py-[3px] -mx-2 px-2"
                style={{
                  fontSize: "0.8125rem",
                  lineHeight: 1.7,
                  borderRadius: "4px",
                  backgroundColor: hoveredTask === task.name ? "rgba(139, 124, 246, 0.04)" : "transparent",
                  transition: "background-color 0.15s ease",
                }}
                initial={{ opacity: 0, x: -4 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.25, delay: delay + 0.12 + i * 0.04 }}
                onMouseEnter={() => setHoveredTask(task.name)}
                onMouseLeave={() => setHoveredTask(null)}
              >
                <motion.span
                  style={{ color: "var(--ok)", fontWeight: 500, opacity: 0.8 }}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                >
                  ✓
                </motion.span>
                <span className="text-foreground/55 flex-1">{task.name}</span>
                <span className="text-muted-foreground/30 shrink-0">{task.time}</span>
              </motion.div>
            ))}

            <motion.div
              className="pt-3 mt-3 space-y-1"
              style={{ borderTop: "1px solid var(--border)", fontSize: "0.8125rem" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.45 }}
            >
              <div className="text-foreground/50">
                <span style={{ color: "var(--ok)", opacity: 0.8 }}>BUILD SUCCESSFUL</span>
                <span className="text-muted-foreground/30"> in 36s</span>
              </div>
              <div className="text-muted-foreground/30" style={{ fontSize: "0.75rem" }}>
                47 actionable tasks: 47 executed · 0 up-to-date
              </div>
            </motion.div>
          </div>
        </MacWindow>
      </section>
    </MotionProvider>
  );
}

// ─── xcrun simctl list devices ─────────────────────────────────────

export function XcodeSimulators({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [hoveredDevice, setHoveredDevice] = useState<string | null>(null);

  const runtimes = [
    {
      runtime: "iOS 18.2",
      devices: [
        { name: "iPhone 16 Pro", udid: "4A3B2C1D-...", state: "Booted" },
        { name: "iPhone 16", udid: "8E7F6A5B-...", state: "Shutdown" },
        { name: "iPad Pro 13-inch (M4)", udid: "C1D2E3F4-...", state: "Shutdown" },
      ],
    },
    {
      runtime: "iOS 17.5",
      devices: [
        { name: "iPhone 15 Pro", udid: "F5E4D3C2-...", state: "Shutdown" },
        { name: "iPhone SE (3rd gen)", udid: "A1B2C3D4-...", state: "Shutdown" },
      ],
    },
  ];

  return (
    <MotionProvider>
      <section className="space-y-4">
        <Cmd delay={delay}>
          xcrun simctl <Accent>list devices</Accent> available
        </Cmd>

        <MacWindow title="simctl — devices" dimLights delay={delay + 0.05}>
          <div ref={ref} className="space-y-4">
            {runtimes.map((rt, ri) => (
              <div key={rt.runtime}>
                <motion.div
                  className="text-foreground/60 pb-1.5"
                  style={{ fontSize: "0.8125rem", fontWeight: 500 }}
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: delay + 0.1 + ri * 0.1 }}
                >
                  -- {rt.runtime} --
                </motion.div>
                {rt.devices.map((dev, di) => (
                  <motion.div
                    key={dev.udid}
                    className="flex items-baseline gap-3 py-[3px] pl-4 -mx-2 px-2 cursor-default"
                    style={{
                      fontSize: "0.8125rem",
                      lineHeight: 1.7,
                      borderRadius: "4px",
                      backgroundColor: hoveredDevice === dev.udid ? "rgba(139, 124, 246, 0.04)" : "transparent",
                      transition: "background-color 0.15s ease",
                    }}
                    initial={{ opacity: 0, x: -4 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.25, delay: delay + 0.15 + ri * 0.1 + di * 0.04 }}
                    onMouseEnter={() => setHoveredDevice(dev.udid)}
                    onMouseLeave={() => setHoveredDevice(null)}
                  >
                    <span className="text-foreground/55 flex-1">{dev.name}</span>
                    <span className="text-muted-foreground/25 shrink-0" style={{ fontSize: "0.6875rem" }}>
                      ({dev.udid})
                    </span>
                    <motion.span
                      className="shrink-0"
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 500,
                        color: dev.state === "Booted" ? "var(--signal-green)" : "var(--muted-foreground)",
                        opacity: dev.state === "Booted" ? 0.8 : 0.3,
                      }}
                      animate={dev.state === "Booted" ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {dev.state}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </MacWindow>
      </section>
    </MotionProvider>
  );
}

// ─── fastlane deploy ───────────────────────────────────────────────

export function FastlaneDeploy({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);

  const lanes = [
    { step: "Ensuring clean git status", icon: "✓", color: "var(--ok)" },
    { step: "Running unit tests (436 passed)", icon: "✓", color: "var(--ok)" },
    { step: "Incrementing build number → 247", icon: "✓", color: "var(--ok)" },
    { step: "Building release APK", icon: "✓", color: "var(--ok)" },
    { step: "Building release IPA", icon: "✓", color: "var(--ok)" },
    { step: "Uploading to Google Play (internal)", icon: "✓", color: "var(--ok)" },
    { step: "Uploading to TestFlight", icon: "✓", color: "var(--ok)" },
    { step: "Posting Slack notification", icon: "✓", color: "var(--ok)" },
  ];

  return (
    <MotionProvider>
      <section className="space-y-4">
        <Cmd delay={delay}>
          fastlane <Accent>deploy</Accent> --env production
        </Cmd>

        <MacWindow title="fastlane — deploy" delay={delay + 0.05}>
          <div ref={ref}>
            <motion.div
              className="text-muted-foreground/25 pb-3"
              style={{ fontSize: "0.6875rem" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.08 }}
            >
              [19:42:08]: Driving the lane 'deploy' 🚀
            </motion.div>

            {lanes.map((lane, i) => (
              <motion.div
                key={lane.step}
                className="flex items-baseline gap-3 py-[3px] -mx-2 px-2 hover:bg-accent/[0.03] transition-colors duration-150"
                style={{ fontSize: "0.8125rem", lineHeight: 1.7, borderRadius: "4px" }}
                initial={{ opacity: 0, x: -4 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.25, delay: delay + 0.12 + i * 0.04 }}
              >
                <motion.span
                  style={{ color: lane.color, fontWeight: 500, opacity: 0.8 }}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                >
                  {lane.icon}
                </motion.span>
                <span className="text-foreground/55">{lane.step}</span>
              </motion.div>
            ))}

            <motion.div
              className="pt-3 mt-3 space-y-1"
              style={{ borderTop: "1px solid var(--border)", fontSize: "0.8125rem" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.5 }}
            >
              <div className="text-foreground/50">
                <span style={{ color: "var(--ok)", opacity: 0.8 }}>fastlane.tools finished successfully</span>
              </div>
              <div className="text-muted-foreground/30" style={{ fontSize: "0.75rem" }}>
                Duration: 4 minutes 12 seconds · Build #247
              </div>
            </motion.div>
          </div>
        </MacWindow>
      </section>
    </MotionProvider>
  );
}

// ─── git log --oneline — click hash to copy ────────────────────────

export function GitLog({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const { copiedText, copy } = useCopy();
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);

  const commits = [
    { hash: "a3f8c21", msg: "fix: resolve KMP expect/actual mismatch on iOS", tag: null, time: "2h ago" },
    { hash: "e91b047", msg: "feat: add biometric auth flow for Android + iOS", tag: "v2.4.0", time: "5h ago" },
    { hash: "7cd2f19", msg: "ci: split Play Store upload into separate lane", tag: null, time: "8h ago" },
    { hash: "1a4e3b8", msg: "refactor: migrate Dagger → Koin for shared module", tag: null, time: "1d ago" },
    { hash: "f62d0c5", msg: "chore: bump AGP to 8.7.0, Kotlin to 2.1.0", tag: null, time: "1d ago" },
    { hash: "b88a41e", msg: "fix: memory leak in image cache on low-end devices", tag: "v2.3.1", time: "2d ago" },
    { hash: "2c90f7d", msg: "feat: offline-first sync with Room + Ktor", tag: null, time: "3d ago" },
  ];

  return (
    <MotionProvider>
      <section className="space-y-4">
        <Cmd delay={delay}>
          git log <Accent>--oneline</Accent> --decorate -7
        </Cmd>

        <MacWindow title="git — log" dimLights delay={delay + 0.05}>
          <div ref={ref}>
            {commits.map((c, i) => (
              <motion.div
                key={c.hash}
                className="flex items-baseline gap-3 py-[3px] -mx-2 px-2"
                style={{
                  fontSize: "0.8125rem",
                  lineHeight: 1.7,
                  borderRadius: "4px",
                  backgroundColor: hoveredHash === c.hash ? "rgba(139, 124, 246, 0.04)" : "transparent",
                  transition: "background-color 0.15s ease",
                }}
                initial={{ opacity: 0, x: -4 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.25, delay: delay + 0.08 + i * 0.04 }}
                onMouseEnter={() => setHoveredHash(c.hash)}
                onMouseLeave={() => setHoveredHash(null)}
              >
                <motion.span
                  className="cursor-pointer select-none"
                  style={{
                    color: copiedText === c.hash ? "var(--accent)" : "var(--signal-yellow)",
                    opacity: hoveredHash === c.hash ? 0.9 : 0.6,
                    fontSize: "0.75rem",
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
                    className="shrink-0 px-1.5 py-0"
                    style={{
                      fontSize: "0.625rem",
                      borderRadius: "3px",
                      color: "var(--accent)",
                      backgroundColor: "rgba(139,124,246,0.1)",
                      fontWeight: 500,
                    }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {c.tag}
                  </motion.span>
                )}
                <span className="text-foreground/55 flex-1">{c.msg}</span>
                <span className="text-muted-foreground/25 shrink-0" style={{ fontSize: "0.6875rem" }}>
                  {c.time}
                </span>
              </motion.div>
            ))}
          </div>
        </MacWindow>
      </section>
    </MotionProvider>
  );
}

// ─── adb logcat (filtered app logs) ────────────────────────────────

export function AdbLogcat({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);
  const [filter, setFilter] = useState<string | null>(null);

  const logs = [
    { time: "14:23:08.412", level: "D", tag: "AppStartup", msg: "Initializing WorkManager…", color: "var(--info)" },
    { time: "14:23:08.445", level: "I", tag: "KoinInit", msg: "Modules loaded: core, network, feature-auth", color: "var(--signal-green)" },
    { time: "14:23:08.501", level: "D", tag: "RoomDB", msg: "Opening database v14 — no migration needed", color: "var(--info)" },
    { time: "14:23:08.623", level: "I", tag: "KtorClient", msg: "Base URL: api.po4yka.dev · timeout: 30s", color: "var(--signal-green)" },
    { time: "14:23:08.891", level: "W", tag: "BiometricAuth", msg: "Fingerprint hardware unavailable on emulator", color: "var(--signal-yellow)" },
    { time: "14:23:09.102", level: "I", tag: "NavGraph", msg: "Start destination: HomeScreen", color: "var(--signal-green)" },
    { time: "14:23:09.340", level: "D", tag: "Compose", msg: "Recomposition count: 3 — first frame rendered", color: "var(--info)" },
    { time: "14:23:09.412", level: "I", tag: "Analytics", msg: "Session started: session_id=8f2a1b", color: "var(--signal-green)" },
  ];

  const filteredLogs = filter ? logs.filter((l) => l.tag === filter) : logs;
  const uniqueTags = [...new Set(logs.map((l) => l.tag))];

  return (
    <MotionProvider>
      <section className="space-y-4">
        <Cmd delay={delay}>
          adb logcat <Accent>-s AppStartup KoinInit RoomDB</Accent> --format=time
        </Cmd>

        <MacWindow title="logcat — app output" dimLights delay={delay + 0.05}>
          <div ref={ref} className="overflow-x-auto">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1 pb-3" style={{ fontSize: "0.625rem" }}>
              <motion.button
                className={`px-1.5 py-0.5 cursor-pointer ${
                  !filter ? "text-accent bg-accent/10" : "text-muted-foreground/30 hover:text-muted-foreground/50"
                }`}
                style={{ borderRadius: "3px", fontFamily: mono }}
                onClick={() => setFilter(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                all
              </motion.button>
              {uniqueTags.map((tag) => (
                <motion.button
                  key={tag}
                  className={`px-1.5 py-0.5 cursor-pointer ${
                    filter === tag ? "text-accent bg-accent/10" : "text-muted-foreground/30 hover:text-muted-foreground/50"
                  }`}
                  style={{ borderRadius: "3px", fontFamily: mono }}
                  onClick={() => setFilter(filter === tag ? null : tag)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tag}
                </motion.button>
              ))}
            </div>

            {filteredLogs.map((log, i) => (
              <motion.div
                key={`${log.time}-${log.tag}`}
                className="flex items-baseline gap-2 py-[2px] whitespace-nowrap hover:bg-accent/[0.03] -mx-1 px-1 transition-colors duration-100"
                style={{ fontSize: "0.75rem", lineHeight: 1.7, borderRadius: "3px" }}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.2, delay: delay + 0.08 + i * 0.035 }}
              >
                <span className="text-muted-foreground/25 shrink-0">{log.time}</span>
                <span
                  className="shrink-0"
                  style={{ color: log.color, opacity: 0.7, fontWeight: 500, minWidth: "12px", textAlign: "center" }}
                >
                  {log.level}
                </span>
                <motion.span
                  className="text-foreground/45 shrink-0 cursor-pointer"
                  style={{ minWidth: "100px" }}
                  onClick={() => setFilter(filter === log.tag ? null : log.tag)}
                  whileHover={{ color: "var(--accent)" }}
                >
                  {log.tag}
                </motion.span>
                <span className="text-foreground/55">{log.msg}</span>
              </motion.div>
            ))}
            <motion.div
              className="text-muted-foreground/20 pt-2"
              style={{ fontSize: "0.6875rem" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.4 }}
            >
              — waiting for more logs —
            </motion.div>
          </div>
        </MacWindow>
      </section>
    </MotionProvider>
  );
}

// ─── pod install / swift package resolve ───────────────────────────

export function SwiftPackageResolve({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);

  const packages = [
    { name: "swift-composable-architecture", version: "1.17.0", source: "github.com/pointfreeco" },
    { name: "Alamofire", version: "5.10.2", source: "github.com/Alamofire" },
    { name: "Kingfisher", version: "8.1.3", source: "github.com/onevcat" },
    { name: "SnapKit", version: "5.7.1", source: "github.com/SnapKit" },
    { name: "KMPNativeCoroutines", version: "1.0.0-ALPHA-38", source: "github.com/nicoretti" },
  ];

  return (
    <MotionProvider>
      <section className="space-y-4">
        <Cmd delay={delay}>
          swift package <Accent>resolve</Accent>
        </Cmd>

        <MacWindow title="spm — resolve" dimLights delay={delay + 0.05}>
          <div ref={ref}>
            <motion.div
              className="text-muted-foreground/30 pb-2"
              style={{ fontSize: "0.75rem" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.08 }}
            >
              Fetching and resolving dependencies…
            </motion.div>

            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                className="flex items-baseline gap-3 py-[3px] -mx-2 px-2 hover:bg-accent/[0.03] transition-colors duration-150"
                style={{ fontSize: "0.8125rem", lineHeight: 1.7, borderRadius: "4px" }}
                initial={{ opacity: 0, x: -4 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.25, delay: delay + 0.12 + i * 0.04 }}
              >
                <motion.span
                  style={{ color: "var(--ok)", opacity: 0.7 }}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                >
                  ✓
                </motion.span>
                <span className="text-foreground/60">{pkg.name}</span>
                <span style={{ color: "var(--accent)", opacity: 0.5, fontSize: "0.6875rem" }}>
                  {pkg.version}
                </span>
                <span className="text-muted-foreground/20" style={{ fontSize: "0.6875rem" }}>
                  {pkg.source}
                </span>
              </motion.div>
            ))}

            <motion.div
              className="text-muted-foreground/30 pt-3"
              style={{ fontSize: "0.75rem", borderTop: "1px solid var(--border)", marginTop: "12px", paddingTop: "12px" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.38 }}
            >
              Resolved 5 packages in 2.8s
            </motion.div>
          </div>
        </MacWindow>
      </section>
    </MotionProvider>
  );
}

// ─── ktlint / detekt check ─────────────────────────────────────────

export function KtlintCheck({ delay = 0 }: { delay?: number }) {
  const { ref, inView } = useInView(0.1);

  return (
    <MotionProvider>
      <section className="space-y-4">
        <Cmd delay={delay}>
          ./gradlew <Accent>detektAll</Accent> ktlintCheck
        </Cmd>

        <OutputBlock delay={delay + 0.05}>
          <div
            ref={ref}
            className="space-y-1"
            style={{ fontSize: "0.8125rem", lineHeight: 1.7 }}
          >
            <motion.div
              className="text-muted-foreground/35"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.08 }}
            >
              &gt; Task :app:detekt
            </motion.div>
            <motion.div
              className="text-foreground/50"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.12 }}
            >
              <span style={{ color: "var(--ok)", opacity: 0.7 }}>✓</span>{" "}
              detekt — 0 issues found in 247 files
            </motion.div>
            <motion.div
              className="text-muted-foreground/35"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.16 }}
            >
              &gt; Task :app:ktlintCheck
            </motion.div>
            <motion.div
              className="text-foreground/50"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.2 }}
            >
              <span style={{ color: "var(--ok)", opacity: 0.7 }}>✓</span>{" "}
              ktlint — all files formatted correctly
            </motion.div>
            <motion.div
              className="text-muted-foreground/25 pt-1"
              style={{ fontSize: "0.75rem" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: delay + 0.28 }}
            >
              BUILD SUCCESSFUL in 8s · 4 actionable tasks executed
            </motion.div>
          </div>
        </OutputBlock>
      </section>
    </MotionProvider>
  );
}
