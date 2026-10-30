import type { Locale } from "./i18n";

/**
 * Sets html[data-locale], which CSS uses to show one of the two languages that
 * static sections render (see the `[data-l]` rule in primitives.css), and
 * <html lang> outside the blog. Blog routes fix their content language by URL
 * (/blog = en, /blog/ru = ru), so relabelling them would mislabel article text;
 * the admin is English-only.
 */
export function applyLocale(locale: Locale): void {
  const root = document.documentElement;
  root.setAttribute("data-locale", locale);
  const fixedLanguage = location.pathname.startsWith("/blog") || location.pathname.startsWith("/admin");
  if (!fixedLanguage) root.lang = locale;
}
