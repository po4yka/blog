import { motion, useMotionValue, useTransform } from "motion/react";
import { lazy, Suspense, useCallback } from "react";
import { BootBlock, Cmd, InfoTable, Accent, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { ReorderableGroup } from "./Decorations/ReorderableGroup";
import { GITHUB_USERNAME } from "@/lib/constants";
import { useClientValue } from "@/hooks/useClientValue";
import { useLocale } from "@/stores/settingsStore";

const CpuMonitor = lazy(() => import("./Decorations").then(m => ({ default: m.CpuMonitor })));
const NetworkGraph = lazy(() => import("./Decorations").then(m => ({ default: m.NetworkGraph })));

const PARALLAX_PX = 10;

const TOOLCHAIN = {
  androidSdk: "35",
  xcode: "16.2",
  kotlin: "2.1.0",
  gradle: "8.12",
  androidHome: "/opt/android-sdk",
} as const;

const formatLoginDate = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function Hero() {
  const { t } = useLocale();
  const loginDate = useClientValue(formatLoginDate, "");
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
    <ErrorBoundary>
    <MotionProvider>
    <section
      aria-labelledby="hero-heading"
      className="space-y-8 pt-8"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <h1 id="hero-heading" className="sr-only">{t("hero.heading")}</h1>
      {/* Visible identity heading */}
      <div className="space-y-1">
        <p className="text-lg font-medium text-foreground/90">{t("hero.name")}</p>
        <p className="text-mono-sm text-foreground/70">{t("hero.subtitle")}</p>
      </div>
      {/* Boot messages */}
      <BootBlock
        lines={[
          {
            status: "OK",
            text: (
              <>
                {t("hero.startingSession")} — <Accent>po4yka.dev</Accent>
              </>
            ),
          },
          { status: "OK", text: `Android SDK ${TOOLCHAIN.androidSdk} ${t("hero.detected")}` },
          { status: "OK", text: `Xcode ${TOOLCHAIN.xcode} ${t("hero.toolchainReady")}` },
          { status: "OK", text: `Kotlin ${TOOLCHAIN.kotlin} / Gradle ${TOOLCHAIN.gradle} ${t("hero.initialized")}` },
          { status: "INFO", text: `ANDROID_HOME=${TOOLCHAIN.androidHome}` },
          {
            status: "INFO",
            text: loginDate ? `${t("hero.lastLogin")}: ${loginDate}` : `${t("hero.lastLogin")}: ...`,
          },
        ]}
      />

      {/* whois + system monitor side-by-side on desktop */}
      <div className="space-y-4">
        <Cmd>
          whois <Accent>po4yka</Accent>
        </Cmd>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          {/* Main info + CTAs */}
          <div className="flex flex-col gap-4">
            <MacWindow title="whois — po4yka" dimLights delay={0.1}>
              <InfoTable
                rows={[
                  {
                    label: t("hero.infoName"),
                    value: (
                      <motion.span
                        className="text-foreground"
                        style={{ fontWeight: 500 }}
                        whileHover={{ color: "var(--accent)" }}
                        transition={{ duration: 0.2 }}
                      >
                        {t("hero.name")}
                      </motion.span>
                    ),
                  },
                  {
                    label: t("hero.infoRole"),
                    value: (
                      <span className="text-foreground/80" style={{ fontWeight: 500 }}>
                        {t("hero.roleMobileDev")}
                      </span>
                    ),
                  },
                  {
                    label: t("hero.infoHandle"),
                    value: <Accent>@po4yka</Accent>,
                  },
                  {
                    label: t("hero.infoFocus"),
                    value: (
                      <span className="text-foreground/70">{t("hero.focusValue").split("\n").map((line, i) => (<span key={i}>{i > 0 && <br />}{line}</span>))}</span>
                    ),
                  },
                  {
                    label: t("hero.infoStatus"),
                    value: (
                      <span className="text-foreground/75">
                      {t("hero.statusValue")}
                    </span>
                    ),
                  },
                ]}
                delay={0.15}
              />
            </MacWindow>

            {/* Above-fold CTA links */}
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { label: "github", href: `https://github.com/${GITHUB_USERNAME}` },
                { label: "blog", href: "/blog" },
                { label: "projects", href: "/projects" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-mono-sm text-foreground/75 hover:text-accent transition-colors duration-200 min-h-[44px] flex items-center"
                >
                  <span className="text-muted-foreground/60">$</span> open --{link.label}
                </a>
              ))}
            </div>
          </div>

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
    </ErrorBoundary>
  );
}
