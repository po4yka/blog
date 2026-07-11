import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BootBlock, Cmd, Accent, Tag } from "./Terminal";
import { SectionHeader } from "./SectionHeader";
import { MotionProvider } from "./MotionProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { useLocale } from "@/stores/settingsStore";
import { useInView } from "@/hooks/useInView";

import { ease, duration, easeStep8, stagger } from "@/lib/motion";
import { blogUrl, type Locale } from "@/lib/i18n";

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  featured?: boolean;
  readingTime?: number;
}

interface BlogListIslandProps {
  posts: BlogPostMeta[];
  categories: string[];
  lang?: string;
}

export function BlogListIsland({ posts, categories, lang: langProp }: BlogListIslandProps) {
  const { t } = useLocale();
  const [activeCategory, setActiveCategory] = useState("All");
  // Initialize from ?tag= on first render (SSR-safe; initializer runs once).
  const [activeTag, setActiveTag] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("tag");
  });
  const lang = (langProp ?? "en") as Locale;

  const clearTag = () => {
    setActiveTag(null);
    if (typeof window !== "undefined" && typeof history !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("tag");
      history.replaceState(null, "", url.toString());
    }
  };

  const selectTag = (tag: string) => {
    setActiveTag(tag);
    if (typeof window !== "undefined" && typeof history !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tag", tag);
      history.replaceState(null, "", url.toString());
    }
  };

  const filtered = useMemo(
    () =>
      posts.filter((p) => {
        if (activeCategory !== "All" && p.category !== activeCategory) return false;
        if (activeTag && !p.tags.includes(activeTag)) return false;
        return true;
      }),
    [activeCategory, activeTag, posts],
  );

  const featured = useMemo(() => posts.find((p) => p.featured), [posts]);

  return (
    <ErrorBoundary>
    <MotionProvider>
    <div className="space-y-12 md:space-y-14">
      <SectionHeader
        level={1}
        number="07"
        label="WRITING"
        heading="Posts"
        meta={`${posts.length} POSTS`}
      />

      {/* Boot block — compressed to 2 lines; the "{n} POSTS" meta in
          SectionHeader already carries the count, and the INFO line below
          carries the "Reading: …" pointer (was duplicated in the header). */}
      <BootBlock
        lines={[
          {
            status: "OK",
            text: (
              <>
                Mounted <Accent>po4yka.dev/blog</Accent>
              </>
            ),
          },
          {
            status: "INFO",
            text: featured ? (
              <>
                {t("blog.reading")}: <Accent>posts/{featured.slug}.txt</Accent>
              </>
            ) : (
              t("blog.browseAll")
            ),
          },
        ]}
      />

      {/* Post listing */}
      <div className="space-y-5">
        <Cmd>
          ls -lt <Accent>./posts/</Accent>
        </Cmd>

        {/* Category filter — flat row separated by │ */}
        <div role="group" aria-label={t("blog.filterByCategory")} className="flex flex-wrap items-center gap-0 pl-1">
          {categories.map((cat, i) => (
            <span key={cat} className="flex items-center">
              {i > 0 && (
                <span className="text-muted-foreground-dim px-2 select-none" aria-hidden="true">
                  │
                </span>
              )}
              <button
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                className={`inline-flex items-center px-1.5 py-0.5 min-h-11 sm:min-h-0 transition-colors duration-150 cursor-pointer text-label ${
                  activeCategory === cat
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "All" ? t("blog.all") : cat}
              </button>
            </span>
          ))}
        </div>

        {/* Active tag filter chip */}
        {activeTag && (
          <div className="pl-1 flex flex-wrap items-center gap-2 font-mono text-label">
            <span className="text-muted-foreground-dim">{t("blogPost.filteredBy")}</span>
            <span className="text-foreground/80">#{activeTag}</span>
            <button
              onClick={clearTag}
              aria-label={t("blogPost.clearFilter")}
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer inline-flex items-center justify-center min-h-11 min-w-11 -my-3 sm:min-h-0 sm:min-w-0 sm:my-0"
            >
              ×
            </button>
          </div>
        )}

        {/* Posts list — flat, no MacWindow wrapping */}
        <div>
          <AnimatePresence mode="wait">
            <motion.ul
              key={`${activeCategory}|${activeTag ?? ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast }}
              className="list-none m-0 p-0"
            >
              {filtered.map((post, i) => (
                <motion.li
                  key={post.slug}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: duration.fast, delay: Math.min(i, 5) * stagger.list, ease }}
                >
                  <a
                    href={blogUrl(lang, post.slug)}
                    className="group w-full text-left flex items-start gap-4 py-6 border-b border-rule last:border-b-0 no-underline"
                    style={{ display: "flex" }}
                  >
                    {/* Marker */}
                    <span
                      className="text-muted-foreground-dim shrink-0 pt-3 text-label"
                      aria-hidden="true"
                    >
                      ›
                    </span>

                    {/* Title + summary */}
                    <div className="flex-1 min-w-0 relative">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="display-2 text-foreground/85 group-hover:text-foreground transition-colors duration-150 inline-block relative">
                          {post.title}
                          <span className="blog-underline absolute left-0 right-0 bottom-[-0.15em] h-[2px]" />
                        </h2>
                        {post.featured && <Tag variant="highlight">{t("blog.featured")}</Tag>}
                      </div>
                      <p className="mt-3 text-[0.9375rem] leading-[1.6] text-muted-foreground line-clamp-2 max-w-[56ch]">
                        {post.summary}
                      </p>
                      <div className="mt-2 flex items-center gap-2 label-meta text-muted-foreground-dim">
                        <span>{post.category}</span>
                        {post.readingTime != null && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>
                              {post.readingTime} {t("blogPost.min")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <span className="text-muted-foreground-dim shrink-0 pt-3 text-label">
                      {post.date}
                    </span>
                  </a>
                </motion.li>
              ))}
              {filtered.length === 0 && (
                <li className="py-8 flex items-baseline gap-3 font-mono text-mono">
                  <span
                    className="shrink-0 font-mono font-medium"
                    style={{
                      color: "var(--muted-foreground)",
                      fontSize: 11,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      paddingTop: "2px",
                    }}
                  >
                    WARN ·
                  </span>
                  <span className="text-foreground/70">{t("blog.noPosts")}</span>
                </li>
              )}
            </motion.ul>
          </AnimatePresence>
        </div>
      </div>

      {/* Blog stats */}
      <BlogStats posts={posts} categories={categories} activeTag={activeTag} onTagClick={selectTag} />
    </div>
    </MotionProvider>
    </ErrorBoundary>
  );
}

function BlogStats({
  posts,
  categories,
  activeTag,
  onTagClick,
}: {
  posts: BlogPostMeta[];
  categories: string[];
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}) {
  const { ref, inView } = useInView(0.1);

  const stats = useMemo(() => {
    const allTags = new Set<string>();
    for (const p of posts) {
      for (const tag of p.tags) allTags.add(tag);
    }
    const catCounts: Record<string, number> = {};
    for (const p of posts) {
      catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;
    }
    return { tagCount: allTags.size, tags: [...allTags], catCounts };
  }, [posts]);

  const realCategories = useMemo(() => categories.filter((c) => c !== "All"), [categories]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: duration.slow, delay: 0.1, ease }}
    >
      <div
        className="flex items-center gap-3 py-2"
        style={{
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <span className="text-muted-foreground-dim select-none text-2xs font-mono">$ wc -l ./posts/*</span>
      </div>
      <div className="pt-5 space-y-4 text-mono-sm">
        {/* Summary row */}
        <div className="flex items-baseline gap-4 text-foreground/80">
          <span>
            <span className="text-foreground font-medium">{posts.length}</span> posts
          </span>
          <span className="text-muted-foreground-dim" aria-hidden="true">│</span>
          <span>
            <span className="text-foreground font-medium">{realCategories.length}</span> categories
          </span>
          <span className="text-muted-foreground-dim" aria-hidden="true">│</span>
          <span>
            <span className="text-foreground font-medium">{stats.tagCount}</span> tags
          </span>
        </div>

        {/* Category breakdown */}
        {realCategories.length > 0 && (
          <div className="space-y-1">
            {realCategories.map((cat) => {
              const count = stats.catCounts[cat] ?? 0;
              const pct = posts.length > 0 ? Math.round((count / posts.length) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-muted-foreground w-24 text-right truncate text-label">{cat}</span>
                  <div aria-hidden="true" className="flex-1 h-[2px] overflow-hidden" style={{ background: "var(--border)" }}>
                    <motion.div
                      className="h-full"
                      style={{
                        background: "var(--foreground)",
                        opacity: 0.5,
                        transformOrigin: "left center",
                        width: `${Math.max(pct, 4)}%`,
                      }}
                      initial={{ scaleX: 0 }}
                      animate={inView ? { scaleX: 1 } : {}}
                      transition={{ duration: 0.6, delay: 0.3, ease: easeStep8 }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8 text-label">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Tags cloud */}
        {stats.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-1 pt-1">
            {stats.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                aria-pressed={activeTag === tag}
                className={`text-label transition-colors duration-150 cursor-pointer ${
                  activeTag === tag
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
