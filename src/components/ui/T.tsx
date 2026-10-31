import { t, type TranslationKey } from "@/lib/i18n";
import { pluralize } from "@/lib/plural";

/**
 * A translated string for a server-only section: both languages are in the
 * static HTML and html[data-locale] (set before paint) shows one, so there is
 * no flash and no client JS. The space keeps the two readable for crawlers
 * that ignore CSS. Shared chrome that also renders inside islands (BootBlock,
 * Cmd) uses it too, so it shows the right language before hydration. Text an
 * island changes at runtime keeps using useLocale().t.
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

/** A count with its noun in both languages, shown the same way as `T`. */
export function TCount({ n, forms }: { n: number; forms: Parameters<typeof pluralize>[2] }) {
  return (
    <>
      <span data-l="en">{pluralize(n, "en", forms)}</span>{" "}
      <span data-l="ru" lang="ru">
        {pluralize(n, "ru", forms)}
      </span>
    </>
  );
}
