import { lazy, Suspense } from "react";
import { Cmd, InfoTable, Accent, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { GITHUB_USERNAME } from "@/lib/constants";
import { useLocale } from "@/stores/settingsStore";

// Build-time-static panels — imported eagerly so Astro SSR can paint their
// content into the initial HTML response (no FOUC, no lazy fallback).
import { BuildStats } from "./Decorations";
import { LatestPostPanel } from "./Decorations";

// Async-data panels — keep lazy so their code only loads when Hero hydrates.
const VisitorContext = lazy(() => import("./Decorations").then(m => ({ default: m.VisitorContext })));
const ActivitySparkline = lazy(() => import("./Decorations").then(m => ({ default: m.ActivitySparkline })));
const LatestReleasePanel = lazy(() => import("./Decorations").then(m => ({ default: m.LatestReleasePanel })));

export function Hero() {
  const { t } = useLocale();

  return (
    <ErrorBoundary>
    <MotionProvider>
    <section
      aria-labelledby="hero-heading"
      className="space-y-8 pt-8"
    >
      <div className="space-y-2">
        <span className="label-meta">01 / IDENTITY</span>
        <h1 id="hero-heading" className="display-1 text-foreground">
          {t("hero.name")}
        </h1>
        <p className="text-mono-lg text-foreground/80">{t("hero.subtitle")}</p>
      </div>

      {/* Visitor context + build stats panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Suspense fallback={null}>
          <VisitorContext delay={0.05} />
        </Suspense>
        <BuildStats delay={0.1} />
      </div>

      {/* whois + sidebar */}
      <div className="space-y-4">
        <Cmd>
          cd ~/po4yka &amp;&amp; cat <Accent>identity.md</Accent>
        </Cmd>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          {/* Main info + CTAs */}
          <div className="flex flex-col gap-4">
            <MacWindow
              title="whois — po4yka"
              titleExt="~/po4yka | main"
              sectionNumber="01"
              delay={0.1}
              lineNumbers={4}
              statusLine
            >
              <InfoTable
                fieldCodes
                rows={[
                  {
                    label: t("hero.infoRole"),
                    value: (
                      <span className="text-foreground font-medium">
                        {t("hero.role")}
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
                      <span className="text-foreground/80">{t("hero.focusValue").split("\n").map((line, i) => (<span key={i}>{i > 0 && <br />}{line}</span>))}</span>
                    ),
                  },
                  {
                    label: t("hero.infoStatus"),
                    value: (
                      <span className="text-foreground/80">
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
                  className="text-mono-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-200 min-h-[44px] flex items-center"
                >
                  <span className="text-muted-foreground-dim">$</span>&nbsp;open --{link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Sidebar: real content panels — desktop only */}
          <div className="hidden lg:flex flex-col gap-4">
            <LatestPostPanel delay={0.15} />
            <Suspense fallback={null}>
              <ActivitySparkline delay={0.2} />
              <LatestReleasePanel delay={0.25} />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
    </MotionProvider>
    </ErrorBoundary>
  );
}
