import { useState, useMemo } from "react";
import type { BlogPostMeta } from "@/types";
import { ALL_CATEGORY, filterPosts, findFeatured, readTagParam, withTagParam } from "@/lib/blog/filter";

function replaceTagInUrl(tag: string | null) {
  if (typeof window !== "undefined" && typeof history !== "undefined") {
    history.replaceState(null, "", withTagParam(window.location.href, tag));
  }
}

export function usePostFilters(posts: BlogPostMeta[]) {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  // Initialize from ?tag= on first render (SSR-safe; initializer runs once).
  const [activeTag, setActiveTag] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return readTagParam(window.location.search);
  });

  const clearTag = () => {
    setActiveTag(null);
    replaceTagInUrl(null);
  };

  const selectTag = (tag: string) => {
    setActiveTag(tag);
    replaceTagInUrl(tag);
  };

  const filtered = useMemo(
    () => filterPosts(posts, activeCategory, activeTag),
    [activeCategory, activeTag, posts],
  );

  const featured = useMemo(() => findFeatured(posts), [posts]);

  return { activeCategory, setActiveCategory, activeTag, selectTag, clearTag, filtered, featured };
}
