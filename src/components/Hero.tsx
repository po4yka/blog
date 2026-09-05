import { lazy, Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { Cmd, InfoTable, Accent, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { GITHUB_USERNAME } from "@/lib/constants";
import { roles } from "@/data/experienceData";
import { useLocale } from "@/stores/settingsStore";

// Build-time-static panels — imported eagerly so Astro SSR can paint their
// content into the initial HTML response (no FOUC, no lazy fallback).
import { BuildStats } from "./Decorations/BuildStats";
import { LatestPostPanel } from "./Decorations/LatestPostPanel";

// Async-data panels — keep lazy so their code only loads when Hero hydrates.
const ActivitySparkline = lazy(() => import("./Decorations/ActivitySparkline").then(m => ({ default: m.ActivitySparkline })));
const LatestReleasePanel = lazy(() => import("./Decorations/LatestReleasePanel").then(m => ({ default: m.LatestReleasePanel })));

const CTA_BASE =
  "inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-[2px] border font-sans text-sm transition-colors duration-200 active:opacity-70";
const CTA_PRIMARY = `${CTA_BASE} bg-muted border-border text-foreground hover:bg-secondary`;
const CTA_SECONDARY = `${CTA_BASE} bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-rule`;

export function Hero() {
  const { t } = useLocale();
  const location = roles[0]?.location;
  // The whois panel carries the full status line; the strip keeps only the
  // first clause so it stays one line on phones.
  const availability = t("hero.statusValue").split(" \u00b7 ")[0];

  return (
    <ErrorBoundary>
    <MotionProvider>
    <section aria-labelledby="hero-heading" className="space-y-10 pt-8 md:pt-12">
      {/* Split hero: identity (name, role, intro, CTAs) cols 1-7, the whois
          spec sheet as the artifact in cols 8-12 (DESIGN.md 5). */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8 items-start">
        <div className="lg:col-span-7 space-y-5">
          <span className="label-meta block">01 / IDENTITY</span>
          <h1 id="hero-heading" className="display-1 text-foreground">
            {t("hero.name")}
          </h1>
          <p className="font-mono text-mono-lg text-foreground/80">{t("hero.subtitle")}</p>
          <p className="font-sans text-[1.0625rem] leading-[1.6] text-muted-foreground max-w-[38rem]">
            {t("hero.intro")}
          </p>

          {/* Meta strip: real, current facts only */}
          <ul className="label-meta text-muted-foreground-dim flex flex-wrap items-center gap-x-2 gap-y-1 list-none m-0 p-0">
            {location && <li>{location}</li>}
            {location && <li aria-hidden="true">·</li>}
            <li>
              <a
                href={`https://github.com/${GITHUB_USERNAME}`}
                className="hover:text-foreground transition-colors duration-200"
              >
                @{GITHUB_USERNAME}
              </a>
            </li>
            <li aria-hidden="true">·</li>
            <li>{availability}</li>
          </ul>

          {/* Above-fold CTAs */}
          <div className="flex flex-wrap gap-3 pt-1">
            <a href="/blog" className={CTA_PRIMARY} data-umami-event="hero-cta" data-umami-event-target="blog">
              {t("hero.ctaBlog")}
            </a>
            <a href="/projects" className={CTA_SECONDARY} data-umami-event="hero-cta" data-umami-event-target="projects">
              {t("hero.ctaProjects")}
            </a>
            <a
              href={`https://github.com/${GITHUB_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`GitHub (${t("links.opensNewWindow")})`}
              className={CTA_SECONDARY}
              data-umami-event="hero-cta"
              data-umami-event-target="github"
            >
              GitHub
              <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3 lg:pt-7">
          <Cmd>
            cd ~/po4yka &amp;&amp; cat <Accent>identity.md</Accent>
          </Cmd>
          <MacWindow
            title="whois — po4yka"
            titleExt="~/po4yka | main"
            sectionNumber="01"
            delay={0.1}
            lineNumbers={4}
            statusLine
            instant
          >
            <InfoTable
              fieldCodes
              instant
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
        </div>
      </div>

      {/* Operator strip: real-data panels, secondary to the identity block.
          Mobile keeps the two that carry content (latest post, build);
          the GitHub-fed pair returns from sm. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LatestPostPanel delay={0.15} />
        <BuildStats delay={0.2} />
        <div className="hidden sm:block">
          <Suspense fallback={null}>
            <ActivitySparkline delay={0.25} />
          </Suspense>
        </div>
        <div className="hidden sm:block">
          <Suspense fallback={null}>
            <LatestReleasePanel delay={0.3} />
          </Suspense>
        </div>
      </div>
    </section>
    </MotionProvider>
    </ErrorBoundary>
  );
}
