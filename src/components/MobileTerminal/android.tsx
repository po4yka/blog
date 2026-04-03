import { motion } from "motion/react";
import { useState } from "react";
import { Accent } from "@/components/Terminal";
import { Shell } from "./Shell";
import { useCopy } from "./_helpers";

// --- adb devices ---

export function AdbDevices({ delay = 0 }: { delay?: number }) {
  const [hoveredSerial, setHoveredSerial] = useState<string | null>(null);
  const { copiedText, copy } = useCopy();

  const devices = [
    { serial: "emulator-5554", state: "device", model: "Pixel_8_API_35" },
    { serial: "R5CR30LHXVT", state: "device", model: "SM-S928B" },
    { serial: "emulator-5556", state: "device", model: "Medium_Tablet_API_35" },
  ];

  return (
    <Shell
      delay={delay}
      command={<>adb <Accent>devices</Accent> -l</>}
      windowTitle="adb — devices"
      dimLights
    >
      {({ inView }) => (
        <>
          <motion.div
            className="text-muted-foreground/40 pb-2 text-mono"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.08 }}
          >
            List of devices attached
          </motion.div>
          {devices.map((d, i) => (
            <motion.div
              key={d.serial}
              className="flex items-baseline gap-4 py-1 -mx-2 px-2 cursor-pointer text-mono rounded-[4px]"
              style={{
                lineHeight: 1.7,
                backgroundColor: hoveredSerial === d.serial ? "rgba(145, 132, 247, 0.05)" : "transparent",
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
                  <span className="text-accent/60 ml-2 text-xs">copied!</span>
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
            className="text-muted-foreground/25 pt-2 text-mono-sm"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.3 }}
          >
            3 devices connected
          </motion.div>
        </>
      )}
    </Shell>
  );
}

// --- adb logcat (filtered app logs) ---

export function AdbLogcat({ delay = 0 }: { delay?: number }) {
  const [filter, setFilter] = useState<string | null>(null);

  const logs = [
    { time: "14:23:08.412", level: "D", tag: "AppStartup", msg: "Initializing WorkManager\u2026", color: "var(--info)" },
    { time: "14:23:08.445", level: "I", tag: "KoinInit", msg: "Modules loaded: core, network, feature-auth", color: "var(--signal-green)" },
    { time: "14:23:08.501", level: "D", tag: "RoomDB", msg: "Opening database v14 \u2014 no migration needed", color: "var(--info)" },
    { time: "14:23:08.623", level: "I", tag: "KtorClient", msg: "Base URL: api.po4yka.dev \u00B7 timeout: 30s", color: "var(--signal-green)" },
    { time: "14:23:08.891", level: "W", tag: "BiometricAuth", msg: "Fingerprint hardware unavailable on emulator", color: "var(--signal-yellow)" },
    { time: "14:23:09.102", level: "I", tag: "NavGraph", msg: "Start destination: HomeScreen", color: "var(--signal-green)" },
    { time: "14:23:09.340", level: "D", tag: "Compose", msg: "Recomposition count: 3 \u2014 first frame rendered", color: "var(--info)" },
    { time: "14:23:09.412", level: "I", tag: "Analytics", msg: "Session started: session_id=8f2a1b", color: "var(--signal-green)" },
  ];

  const filteredLogs = filter ? logs.filter((l) => l.tag === filter) : logs;
  const uniqueTags = [...new Set(logs.map((l) => l.tag))];

  return (
    <Shell
      delay={delay}
      command={<>adb logcat <Accent>-s AppStartup KoinInit RoomDB</Accent> --format=time</>}
      windowTitle="logcat — app output"
      dimLights
    >
      {({ inView }) => (
        <div className="overflow-x-auto">
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-1 pb-3 text-xs">
            <motion.button
              className={`px-1.5 py-0.5 cursor-pointer ${
                !filter ? "text-accent bg-accent/10" : "text-muted-foreground/30 hover:text-muted-foreground/50"
              } rounded-[3px] font-mono`}
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
                } rounded-[3px] font-mono`}
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
              className="flex items-baseline gap-2 py-[2px] whitespace-nowrap hover:bg-accent/[0.03] -mx-1 px-1 transition-colors duration-100 text-mono-sm rounded-[3px]"
              style={{ lineHeight: 1.7 }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.2, delay: delay + 0.08 + i * 0.035 }}
            >
              <span className="text-muted-foreground/25 shrink-0">{log.time}</span>
              <span
                className="shrink-0 font-medium"
                style={{ color: log.color, opacity: 0.7, minWidth: "12px", textAlign: "center" }}
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
            className="text-muted-foreground/20 pt-2 text-label"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.4 }}
          >
            — waiting for more logs —
          </motion.div>
        </div>
      )}
    </Shell>
  );
}
