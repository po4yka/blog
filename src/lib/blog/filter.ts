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

export function computeListStats(posts: BlogPostMeta[]): {
  tagCount: number;
  tags: string[];
  catCounts: Record<string, number>;
} {
  const allTags = new Set<string>();
  for (const p of posts) {
    for (const tag of p.tags) allTags.add(tag);
  }
  const catCounts: Record<string, number> = {};
  for (const p of posts) {
    catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;
  }
  return { tagCount: allTags.size, tags: [...allTags], catCounts };
}

export function categoryPercent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
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
