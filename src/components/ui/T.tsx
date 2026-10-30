import { t, type TranslationKey } from "@/lib/i18n";

/**
 * A translated string for a server-only section: both languages are in the
 * static HTML and html[data-locale] (set before paint) shows one, so there is
 * no flash and no client JS. The space keeps the two readable for crawlers
 * that ignore CSS. Islands that hydrate keep using useLocale().t instead.
 */
export function T({ k }: { k: TranslationKey }) {
  return (
    <>
      <span data-l="en">{t("en", k)}</span>{" "}
      <span data-l="ru" lang="ru">
        {t("ru", k)}
      </span>
    </>
  );
}
