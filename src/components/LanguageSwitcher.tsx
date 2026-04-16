import { motion } from "motion/react";
import { useLocale, useSettings } from "@/stores/settingsStore";
import type { Locale } from "@/lib/i18n";

interface LanguageSwitcherProps {
  translationUrl?: string;
  activeLang?: Locale;
  className?: string;
}

const langs: Locale[] = ["en", "ru"];

export function LanguageSwitcher({ translationUrl, activeLang, className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();
  const { reduceMotion } = useSettings();
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
          <motion.button
            onClick={() => handleSwitch(lang)}
            className="relative px-1.5 py-0.5 rounded-[4px] cursor-pointer overflow-hidden"
            aria-current={displayLang === lang ? "true" : undefined}
            whileHover={displayLang !== lang ? { scale: 1.05 } : undefined}
            whileTap={{ scale: 0.95 }}
          >
            {/* Sliding background indicator */}
            {displayLang === lang && (
              <motion.span
                className="absolute inset-0 rounded-[4px] bg-accent/10"
                layoutId={reduceMotion ? undefined : "lang-indicator"}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 28 }}
              />
            )}
            <motion.span
              className="relative z-10"
              animate={{
                color: displayLang === lang ? "var(--accent)" : "var(--muted-foreground)",
                textShadow: displayLang === lang ? "var(--phosphor-glow)" : "none",
              }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.25 }}
            >
              {t(`lang.${lang}` as const)}
            </motion.span>
            {/* Scale pulse on activation */}
            {displayLang === lang && !reduceMotion && (
              <motion.span
                className="absolute inset-0 rounded-[4px] border border-accent/20"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.3, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                key={`pulse-${lang}`}
              />
            )}
          </motion.button>
        </span>
      ))}
    </span>
  );
}
