import type { BlogPostMeta } from "@/types";

export const ALL_CATEGORY = "All";

export function filterPosts(posts: BlogPostMeta[], category: string, tag: string | null): BlogPostMeta[] {
  return posts.filter((p) => {
    if (category !== ALL_CATEGORY && p.category !== category) return false;
    if (tag && !p.tags.includes(tag)) return false;
    return true;
  });
}

export function findFeatured(posts: BlogPostMeta[]): BlogPostMeta | undefined {
  return posts.find((p) => p.featured);
}

/** Every tag used by the posts, once each, in first-seen order. */
export function uniqueTags(posts: BlogPostMeta[]): string[] {
  return [...new Set(posts.flatMap((p) => p.tags))];
}

export function readTagParam(search: string): string | null {
  return new URLSearchParams(search).get("tag");
}

/** Set (or, for null, delete) the tag param and keep every other query param. */
export function withTagParam(href: string, tag: string | null): string {
  const url = new URL(href);
  if (tag === null) url.searchParams.delete("tag");
  else url.searchParams.set("tag", tag);
  return url.toString();
}
