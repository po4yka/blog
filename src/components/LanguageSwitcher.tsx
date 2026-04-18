import { useLocale } from "@/stores/settingsStore";
import type { Locale } from "@/lib/i18n";

interface LanguageSwitcherProps {
  translationUrl?: string;
  activeLang?: Locale;
  className?: string;
}

const langs: Locale[] = ["en", "ru"];

export function LanguageSwitcher({ translationUrl, activeLang, className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();
  const displayLang = activeLang ?? locale;

  const handleSwitch = (target: Locale) => {
    if (target === displayLang) return;
    setLocale(target);
    if (translationUrl) {
      // eslint-disable-next-line react-hooks/immutability -- intentional navigation to translated page
      window.location.href = translationUrl;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-label ${className}`}
      role="group"
      aria-label={t("lang.switchTo")}
    >
      {langs.map((lang, i) => (
        <span key={lang} className="inline-flex items-center gap-0.5">
          {i > 0 && (
            <span className="text-muted-foreground/20 select-none">|</span>
          )}
          <button
            onClick={() => handleSwitch(lang)}
            className="relative px-1.5 py-0.5 cursor-pointer overflow-hidden transition-colors duration-200"
            style={{
              borderRadius: 2,
              color: displayLang === lang ? "var(--foreground)" : "var(--muted-foreground)",
              fontWeight: displayLang === lang ? 500 : 400,
              background: displayLang === lang ? "var(--muted)" : "transparent",
            }}
            aria-current={displayLang === lang ? "true" : undefined}
            data-umami-event="lang-switch"
            data-umami-event-target={lang}
          >
            <span className="relative z-10">
              {t(`lang.${lang}` as const)}
            </span>
          </button>
        </span>
      ))}
    </span>
  );
}
