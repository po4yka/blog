import { useEffect, useState, useMemo } from "react";
import type { BlogPostMeta } from "@/types";
import { ALL_CATEGORY, filterPosts, findFeatured, readTagParam, withTagParam } from "@/lib/blog/filter";

function replaceTagInUrl(tag: string | null) {
  if (typeof window !== "undefined" && typeof history !== "undefined") {
    history.replaceState(null, "", withTagParam(window.location.href, tag));
  }
}

export function usePostFilters(posts: BlogPostMeta[]) {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  // The prerendered list has no tag filter, so hydrate without one and apply ?tag= after mount;
  // reading the URL during the first render made the client HTML differ from the server's.
  const [activeTag, setActiveTag] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only readable after hydration
    setActiveTag(readTagParam(window.location.search));
  }, []);

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
