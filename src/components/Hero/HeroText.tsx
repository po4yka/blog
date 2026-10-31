import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { T } from "@/components/ui/T";
import { GITHUB_USERNAME } from "@/lib/constants";
import { roles } from "@/data/experienceData";
import { t, type Locale } from "@/lib/i18n";

const CTA_BASE =
  "inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-[2px] border font-sans text-sm transition-colors duration-200 active:opacity-70";
const CTA_PRIMARY = `${CTA_BASE} bg-muted border-border text-foreground hover:bg-secondary`;
const CTA_SECONDARY = `${CTA_BASE} bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-rule`;

const LOCALES: Locale[] = ["en", "ru"];

/** The name in one language: one real string, each word on its own line. */
function Name({ lang }: { lang: Locale }) {
  const [given = "", family = ""] = t(lang, "hero.name").split(" ");
  return (
    <span data-l={lang} lang={lang === "ru" ? "ru" : undefined}>
      <span className="block display-name-given">{given}</span> <span className="block display-name-family">{family}</span>
    </span>
  );
}

/**
 * Hero identity column. Server-only (no client directive): both languages are
 * in the static HTML. The h1 never fades so it can be the LCP element; every
 * other line fades in with a short CSS stagger.
 */
export function HeroText() {
  const location = roles[0]?.location;

  return (
    <div className="lg:col-span-7 space-y-5 @container">
      {/* @container: the name (--step-6) is sized in cqi so it fills this column at every width. */}
      <Reveal as="span" className="label-meta block">
        01 / IDENTITY
      </Reveal>
      <h1 id="hero-heading" className="display-name text-foreground">
        <Name lang="en" /> <Name lang="ru" />
      </h1>
      <Reveal as="p" delay={0.06} className="font-mono text-mono-lg text-foreground/80">
        <T k="hero.subtitle" />
      </Reveal>
      {/* No fade: on phones this paragraph can be the LCP element, and a fade delays LCP. */}
      <p className="font-sans text-[1.0625rem] leading-[1.6] text-muted-foreground max-w-[38rem]">
        <T k="hero.intro" />
      </p>

      {/* Meta strip: real, current facts only. The strip keeps only the first
          status clause so it stays one line on phones. */}
      <Reveal
        as="ul"
        delay={0.18}
        className="label-meta text-muted-foreground-dim flex flex-wrap items-center gap-x-2 gap-y-1 list-none m-0 p-0"
      >
        {location && <li>{location}</li>}
        {location && <li aria-hidden="true">·</li>}
        <li>
          <a
            href={`https://github.com/${GITHUB_USERNAME}`}
            // A 44px touch area from ::after keeps the one-line meta strip at its height.
            className="relative hover:text-foreground transition-colors duration-200 [@media(pointer:coarse)]:after:absolute [@media(pointer:coarse)]:after:inset-x-0 [@media(pointer:coarse)]:after:-inset-y-4 [@media(pointer:coarse)]:after:content-['']"
          >
            @{GITHUB_USERNAME}
          </a>
        </li>
        <li aria-hidden="true">·</li>
        <li>
          {LOCALES.map((lang) => (
            <span key={lang} data-l={lang} lang={lang === "ru" ? "ru" : undefined}>
              {t(lang, "hero.statusValue").split(" · ")[0]}
            </span>
          ))}
        </li>
      </Reveal>

      <Reveal delay={0.24} className="flex flex-wrap gap-3 pt-1">
        <a href="/blog" className={CTA_PRIMARY} data-umami-event="hero-cta" data-umami-event-target="blog">
          <T k="hero.ctaBlog" />
        </a>
        <a href="/projects" className={CTA_SECONDARY} data-umami-event="hero-cta" data-umami-event-target="projects">
          <T k="hero.ctaProjects" />
        </a>
        <a
          href={`https://github.com/${GITHUB_USERNAME}`}
          target="_blank"
          rel="noopener noreferrer"
          className={CTA_SECONDARY}
          data-umami-event="hero-cta"
          data-umami-event-target="github"
        >
          GitHub
          <span className="sr-only">
            {" ("}
            <T k="links.opensNewWindow" />)
          </span>
          <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
        </a>
      </Reveal>

      {/* Static text: the nav button is the clickable opener. Keyboard hints only where a keyboard is likely. */}
      <p className="label-meta text-muted-foreground-dim hidden [@media(hover:hover)_and_(pointer:fine)]:block">
        <T k="palette.hint" />
      </p>
    </div>
  );
}
