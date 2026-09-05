import type { Locale } from "@/lib/i18n";

/**
 * Count with a localized noun. English: singular/plural. Russian: the three
 * forms by the last digit, with 11-14 always taking the genitive plural
 * (1 релиз, 2 релиза, 5 релизов, 11 релизов, 21 релиз).
 */
export function pluralize(
  count: number,
  locale: Locale,
  forms: { en: [string, string]; ru: [string, string, string] },
): string {
  if (locale !== "ru") return `${count} ${count === 1 ? forms.en[0] : forms.en[1]}`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  const form =
    mod100 >= 11 && mod100 <= 14 ? forms.ru[2]
    : mod10 === 1 ? forms.ru[0]
    : mod10 >= 2 && mod10 <= 4 ? forms.ru[1]
    : forms.ru[2];
  return `${count} ${form}`;
}
