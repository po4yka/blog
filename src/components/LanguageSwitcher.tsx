import { useLocale } from "@/stores/settingsStore";
import type { Locale } from "@/lib/i18n";

interface LanguageSwitcherProps {
  /** When on a blog page, provide the URL of the translation (if it exists) */
  translationUrl?: string;
  className?: string;
}

export function LanguageSwitcher({ translationUrl, className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();

  const handleSwitch = (target: Locale) => {
    if (target === locale) return;
    setLocale(target);
    // On blog pages with a translation URL, navigate to it
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
          locale === "en"
            ? "text-accent bg-accent/10"
            : "text-muted-foreground/40 hover:text-foreground/60"
        }`}
        aria-current={locale === "en" ? "true" : undefined}
      >
        {t("lang.en")}
      </button>
      <span className="text-muted-foreground/20">|</span>
      <button
        onClick={() => handleSwitch("ru")}
        className={`px-1.5 py-0.5 rounded-[4px] transition-colors duration-200 cursor-pointer ${
          locale === "ru"
            ? "text-accent bg-accent/10"
            : "text-muted-foreground/40 hover:text-foreground/60"
        }`}
        aria-current={locale === "ru" ? "true" : undefined}
      >
        {t("lang.ru")}
      </button>
    </span>
  );
}
