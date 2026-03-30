import { motion, useMotionValue, useTransform } from "motion/react";
import { lazy, Suspense, useCallback } from "react";
import { BootBlock, Cmd, InfoTable, Accent, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { ReorderableGroup } from "./Decorations/ReorderableGroup";

const CpuMonitor = lazy(() => import("./Decorations").then(m => ({ default: m.CpuMonitor })));
const NetworkGraph = lazy(() => import("./Decorations").then(m => ({ default: m.NetworkGraph })));

const PARALLAX_PX = 4;

export function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const decorX = useTransform(mouseX, [-1, 1], [-PARALLAX_PX, PARALLAX_PX]);
  const decorY = useTransform(mouseY, [-1, 1], [-PARALLAX_PX, PARALLAX_PX]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
      mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <MotionProvider>
    <section
      className="space-y-8 pt-8"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
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

          {/* Decorative system widgets — desktop only, with parallax */}
          <Suspense fallback={null}>
            <motion.div
              className="hidden lg:flex flex-col gap-4"
              style={{ x: decorX, y: decorY }}
            >
              <ReorderableGroup containerKey="heroSidebar" axis="y" className="flex flex-col gap-4">
                {{
                  cpu: <CpuMonitor delay={0.2} />,
                  net: <NetworkGraph delay={0.3} />,
                }}
              </ReorderableGroup>
            </motion.div>
          </Suspense>
        </div>
      </div>
    </section>
    </MotionProvider>
  );
}
