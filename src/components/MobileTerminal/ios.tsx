import { motion } from "motion/react";
import { useState } from "react";
import { Accent } from "@/components/Terminal";
import { Shell } from "./Shell";

// --- xcrun simctl list devices ---

export function XcodeSimulators({ delay = 0 }: { delay?: number }) {
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
    <Shell
      delay={delay}
      command={<>xcrun simctl <Accent>list devices</Accent> available</>}
      windowTitle="simctl — devices"
      dimLights
    >
      {({ inView }) => (
        <div className="space-y-4">
          {runtimes.map((rt, ri) => (
            <div key={rt.runtime}>
              <motion.div
                className="text-foreground/60 pb-1.5 text-mono font-medium"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: delay + 0.1 + ri * 0.1 }}
              >
                -- {rt.runtime} --
              </motion.div>
              {rt.devices.map((dev, di) => (
                <motion.div
                  key={dev.udid}
                  className="flex items-baseline gap-3 py-[3px] pl-4 -mx-2 px-2 cursor-default text-mono rounded-[4px]"
                  style={{
                    lineHeight: 1.7,
                    backgroundColor: hoveredDevice === dev.udid ? "rgba(145, 132, 247, 0.04)" : "transparent",
                    transition: "background-color 0.15s ease",
                  }}
                  initial={{ opacity: 0, x: -4 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.25, delay: delay + 0.15 + ri * 0.1 + di * 0.04 }}
                  onMouseEnter={() => setHoveredDevice(dev.udid)}
                  onMouseLeave={() => setHoveredDevice(null)}
                >
                  <span className="text-foreground/55 flex-1">{dev.name}</span>
                  <span className="text-muted-foreground/25 shrink-0 text-label">
                    ({dev.udid})
                  </span>
                  <span
                    className="shrink-0 text-label font-medium"
                    style={{
                      color: dev.state === "Booted" ? "var(--signal-green)" : "var(--muted-foreground)",
                      opacity: dev.state === "Booted" ? 0.8 : 0.3,
                    }}
                  >
                    {dev.state}
                  </span>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

// --- pod install / swift package resolve ---

export function SwiftPackageResolve({ delay = 0 }: { delay?: number }) {
  const packages = [
    { name: "swift-composable-architecture", version: "1.17.0", source: "github.com/pointfreeco" },
    { name: "Alamofire", version: "5.10.2", source: "github.com/Alamofire" },
    { name: "Kingfisher", version: "8.1.3", source: "github.com/onevcat" },
    { name: "SnapKit", version: "5.7.1", source: "github.com/SnapKit" },
    { name: "KMPNativeCoroutines", version: "1.0.0-ALPHA-38", source: "github.com/nicoretti" },
  ];

  return (
    <Shell
      delay={delay}
      command={<>swift package <Accent>resolve</Accent></>}
      windowTitle="spm — resolve"
      dimLights
    >
      {({ inView }) => (
        <>
          <motion.div
            className="text-muted-foreground/30 pb-2 text-mono-sm"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.08 }}
          >
            Fetching and resolving dependencies...
          </motion.div>

          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              className="flex items-baseline gap-3 py-[3px] -mx-2 px-2 hover:bg-accent/[0.03] transition-colors duration-150 text-mono rounded-[4px]"
              style={{ lineHeight: 1.7 }}
              initial={{ opacity: 0, x: -4 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.25, delay: delay + 0.12 + i * 0.04 }}
            >
              <motion.span
                style={{ color: "var(--ok)", opacity: 0.7 }}
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                {"\u2713"}
              </motion.span>
              <span className="text-foreground/60">{pkg.name}</span>
              <span className="text-label" style={{ color: "var(--accent)", opacity: 0.5 }}>
                {pkg.version}
              </span>
              <span className="text-muted-foreground/20 text-label">
                {pkg.source}
              </span>
            </motion.div>
          ))}

          <motion.div
            className="text-muted-foreground/30 pt-3 text-mono-sm"
            style={{ borderTop: "1px solid var(--border)", marginTop: "12px", paddingTop: "12px" }}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: delay + 0.38 }}
          >
            Resolved 5 packages in 2.8s
          </motion.div>
        </>
      )}
    </Shell>
  );
}
