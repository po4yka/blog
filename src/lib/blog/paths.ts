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

/**
 * One entry per slug: the version in `locale`, or the only version that exists. The generated
 * post list holds one entry per language, so a list or a count of posts goes through this.
 */
export function postsInLocale<T extends { slug: string; lang?: string }>(posts: readonly T[], locale: string): T[] {
  const bySlug = new Map<string, T>();
  for (const post of posts) {
    if (!bySlug.has(post.slug) || (post.lang ?? "en") === locale) bySlug.set(post.slug, post);
  }
  return [...bySlug.values()];
}
