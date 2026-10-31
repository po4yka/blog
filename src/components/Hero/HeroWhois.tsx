import { InfoTable, Em, OperatorPanel } from "@/components/Terminal";
import { Reveal } from "@/components/ui/Reveal";
import { t, type Locale } from "@/lib/i18n";

/** One table per language: InfoTable pads field codes from the label length, which differs per language. */
function Whois({ lang }: { lang: Locale }) {
  return (
    <div data-l={lang} lang={lang === "ru" ? "ru" : undefined}>
      <InfoTable
        fieldCodes
        instant
        rows={[
          {
            label: t(lang, "hero.infoRole"),
            value: <span className="text-foreground font-medium">{t(lang, "hero.role")}</span>,
          },
          { label: t(lang, "hero.infoHandle"), value: <Em>@po4yka</Em> },
          {
            label: t(lang, "hero.infoFocus"),
            value: (
              <span className="text-foreground/80">
                {t(lang, "hero.focusValue")
                  .split("\n")
                  .map((line, i) => (
                    <span key={line}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ))}
              </span>
            ),
          },
          {
            label: t(lang, "hero.infoStatus"),
            value: <span className="text-foreground/80">{t(lang, "hero.statusValue")}</span>,
          },
        ]}
        delay={0.15}
      />
    </div>
  );
}

/** Hero whois spec sheet. Server-only (no client directive), both languages in the HTML. */
export function HeroWhois() {
  return (
    <Reveal delay={0.12} className="lg:col-span-5 space-y-3 lg:pt-7">
      {/* Static line: Cmd is a click-to-copy button and this component is never hydrated. */}
      <div className="flex items-baseline gap-2 font-mono text-mono-lg min-w-0">
        <span className="select-none" style={{ color: "var(--emphasis)", fontWeight: 500 }}>
          $
        </span>
        <span className="text-foreground min-w-0 break-all" style={{ opacity: 0.92 }}>
          cd ~/po4yka &amp;&amp; cat <Em>identity.md</Em>
        </span>
      </div>
      <OperatorPanel
        label="whois — po4yka"
        titleExt="~/po4yka | main"
        sectionNumber="01"
        delay={0.1}
        lineNumbers={4}
        statusLine
        instant
      >
        <Whois lang="en" />
        <Whois lang="ru" />
      </OperatorPanel>
    </Reveal>
  );
}
