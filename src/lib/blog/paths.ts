/** URL path of a post. Uses the RU page when it is the only version, or when the locale is ru and a RU version exists. */
export function postPath(
  posts: readonly { slug: string; lang?: string }[],
  slug: string,
  locale: string,
): string | null {
  const langs = posts.filter((p) => p.slug === slug).map((p) => p.lang ?? "en");
  if (langs.length === 0) return null;
  const ru = langs.includes("ru") && (locale === "ru" || !langs.includes("en"));
  return ru ? `/blog/ru/${slug}` : `/blog/${slug}`;
}
