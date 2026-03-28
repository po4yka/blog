import { motion } from "motion/react";
import { BootBlock, Cmd, InfoTable, Accent, MacWindow } from "./Terminal";
import { CpuMonitor, MemoryPanel, NetworkGraph } from "./Decorations";
import { MotionProvider } from "./MotionProvider";

export function Hero() {
  return (
    <MotionProvider>
    <section className="space-y-8 pt-8">
      {/* Boot messages */}
      <BootBlock
        lines={[
          {
            status: "OK",
            text: (
              <>
                Starting session — <Accent>po4yka.dev</Accent>
              </>
            ),
          },
          { status: "OK", text: "Android SDK 35 detected" },
          { status: "OK", text: "Xcode 16.2 toolchain ready" },
          { status: "OK", text: "Kotlin 2.1.0 / Gradle 8.7 initialized" },
          { status: "INFO", text: "ANDROID_HOME=/opt/android-sdk" },
          {
            status: "INFO",
            text: `Last login: ${new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`,
          },
        ]}
      />

      {/* whois + system monitor side-by-side on desktop */}
      <div className="space-y-4">
        <Cmd>
          whois <Accent>po4yka</Accent>
        </Cmd>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          {/* Main info */}
          <MacWindow title="whois — po4yka" dimLights delay={0.1}>
            <InfoTable
              rows={[
                {
                  label: "name",
                  value: (
                    <motion.span
                      className="text-foreground"
                      style={{ fontWeight: 500 }}
                      whileHover={{ color: "var(--accent)" }}
                      transition={{ duration: 0.2 }}
                    >
                      Nikita Pochaev
                    </motion.span>
                  ),
                },
                {
                  label: "role",
                  value: (
                    <span className="text-foreground/80" style={{ fontWeight: 500 }}>
                      Mobile Developer
                    </span>
                  ),
                },
                {
                  label: "handle",
                  value: <Accent>@po4yka</Accent>,
                },
                {
                  label: "focus",
                  value: (
                    <span className="text-foreground/70">
                      Android, iOS, Kotlin Multiplatform,
                      <br />
                      MobileOps, CI/CD, Release Automation
                    </span>
                  ),
                },
                {
                  label: "status",
                  value: (
                    <span className="text-foreground/60">
                      open to collaboration · building tools & apps
                    </span>
                  ),
                },
              ]}
              delay={0.15}
            />
          </MacWindow>

          {/* Decorative system widgets — desktop only */}
          <div className="hidden lg:flex flex-col gap-4">
            <CpuMonitor delay={0.2} />
            <NetworkGraph delay={0.3} />
          </div>
        </div>
      </div>
    </section>
    </MotionProvider>
  );
}
