import type { CollectionEntry } from "astro:content";
import { parsePostId, type Locale } from "@/lib/i18n";

type BlogEntry = CollectionEntry<"blog"> & {
  data: CollectionEntry<"blog">["data"] & {
    isoDate?: string;
  };
};

type PreparedBlogPost = {
  post: BlogEntry;
  baseSlug: string;
  dateTime: number;
  tags: Set<string>;
};

type RelatedPost = {
  slug: string;
  title: string;
  date: string;
  isoDate?: string;
  category: string;
  summary: string;
};

type AdjacentPost = {
  slug: string;
  title: string;
  date: string;
};

type BlogStaticPath = {
  params: { slug: string };
  props: {
    post: BlogEntry;
    prev: AdjacentPost | null;
    next: AdjacentPost | null;
    related: RelatedPost[];
    hasTranslation: boolean;
  };
};

type RelatedCandidate = {
  item: PreparedBlogPost;
  overlap: number;
  sameCategory: number;
};

const otherLocale = (locale: Locale): Locale => (locale === "en" ? "ru" : "en");

const toAdjacentPost = (item: PreparedBlogPost): AdjacentPost => ({
  slug: item.baseSlug,
  title: item.post.data.title,
  date: item.post.data.date,
});

const toRelatedPost = (item: PreparedBlogPost): RelatedPost => ({
  slug: item.baseSlug,
  title: item.post.data.title,
  date: item.post.data.date,
  isoDate: item.post.data.isoDate,
  category: item.post.data.category,
  summary: item.post.data.summary,
});

const countTagOverlap = (a: Set<string>, b: Set<string>): number => {
  let overlap = 0;
  for (const tag of b) {
    if (a.has(tag)) overlap += 1;
  }
  return overlap;
};

const isBetterRelated = (candidate: RelatedCandidate, existing: RelatedCandidate): boolean => {
  if (candidate.overlap !== existing.overlap) return candidate.overlap > existing.overlap;
  if (candidate.sameCategory !== existing.sameCategory) return candidate.sameCategory > existing.sameCategory;
  return candidate.item.dateTime > existing.item.dateTime;
};

const insertTopRelated = (top: RelatedCandidate[], candidate: RelatedCandidate): void => {
  for (let index = 0; index < top.length; index += 1) {
    if (isBetterRelated(candidate, top[index]!)) {
      top.splice(index, 0, candidate);
      if (top.length > 3) top.pop();
      return;
    }
  }

  if (top.length < 3) top.push(candidate);
};

const getRelatedPosts = (current: PreparedBlogPost, posts: PreparedBlogPost[]): RelatedPost[] => {
  const top: RelatedCandidate[] = [];

  for (const candidate of posts) {
    if (candidate.baseSlug === current.baseSlug) continue;

    insertTopRelated(top, {
      item: candidate,
      overlap: countTagOverlap(current.tags, candidate.tags),
      sameCategory: candidate.post.data.category === current.post.data.category ? 1 : 0,
    });
  }

  return top.map(({ item }) => toRelatedPost(item));
};

export function buildBlogStaticPaths(allPosts: CollectionEntry<"blog">[], locale: Locale): BlogStaticPath[] {
  const byLocale = new Map<Locale, PreparedBlogPost[]>([
    ["en", []],
    ["ru", []],
  ]);

  for (const post of allPosts as BlogEntry[]) {
    const { lang, baseSlug } = parsePostId(post.id);
    byLocale.get(lang)!.push({
      post,
      baseSlug,
      dateTime: new Date(post.data.date).getTime(),
      tags: new Set(post.data.tags ?? []),
    });
  }

  for (const posts of byLocale.values()) {
    posts.sort((a, b) => b.dateTime - a.dateTime);
  }

  const localePosts = byLocale.get(locale)!;
  const translationSlugs = new Set(byLocale.get(otherLocale(locale))!.map((item) => item.baseSlug));

  return localePosts.map((item, index) => ({
    params: { slug: item.baseSlug },
    props: {
      post: item.post,
      prev: index > 0 ? toAdjacentPost(localePosts[index - 1]!) : null,
      next: index < localePosts.length - 1 ? toAdjacentPost(localePosts[index + 1]!) : null,
      related: getRelatedPosts(item, localePosts),
      hasTranslation: translationSlugs.has(item.baseSlug),
    },
  }));
}
