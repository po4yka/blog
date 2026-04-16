import { useLocale } from "@/stores/settingsStore";
import type { Locale } from "@/lib/i18n";

interface LanguageSwitcherProps {
  /** When on a blog page, provide the URL of the translation (if it exists) */
  translationUrl?: string;
  /** Override the active language indicator (e.g. from the page's own lang prop) */
  activeLang?: Locale;
  className?: string;
}

export function LanguageSwitcher({ translationUrl, activeLang, className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();
  const displayLang = activeLang ?? locale;

  const handleSwitch = (target: Locale) => {
    if (target === displayLang) return;
    setLocale(target);
    if (translationUrl) {
      window.location.href = translationUrl;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-label ${className}`}
      role="group"
      aria-label={t("lang.switchTo")}
    >
      <button
        onClick={() => handleSwitch("en")}
        className={`px-1.5 py-0.5 rounded-[4px] transition-colors duration-200 cursor-pointer ${
          displayLang === "en"
            ? "text-accent bg-accent/10"
            : "text-muted-foreground/40 hover:text-foreground/60"
        }`}
        aria-current={displayLang === "en" ? "true" : undefined}
      >
        {t("lang.en")}
      </button>
      <span className="text-muted-foreground/20">|</span>
      <button
        onClick={() => handleSwitch("ru")}
        className={`px-1.5 py-0.5 rounded-[4px] transition-colors duration-200 cursor-pointer ${
          displayLang === "ru"
            ? "text-accent bg-accent/10"
            : "text-muted-foreground/40 hover:text-foreground/60"
        }`}
        aria-current={displayLang === "ru" ? "true" : undefined}
      >
        {t("lang.ru")}
      </button>
    </span>
  );
}
