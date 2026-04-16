import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BootBlock, Cmd, Accent, MacWindow } from "./Terminal";
import { useInView } from "@/hooks/useInView";
import { MotionProvider } from "./MotionProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { useLocale } from "@/stores/settingsStore";

import { ease, duration, stagger, spring } from "@/lib/motion";

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

export function BlogListIsland({ posts, categories }: BlogListIslandProps) {
  const { t } = useLocale();
  const [activeCategory, setActiveCategory] = useState("All");
  const { ref } = useInView(0.05);

  const filtered =
    activeCategory === "All"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  const featured = posts.find((p) => p.featured);

  return (
    <ErrorBoundary>
    <MotionProvider>
    <div className="space-y-8">
      {/* Boot block */}
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
            status: "OK",
            text: `${posts.length} ${t("blog.publishedPosts")}`,
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

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 pl-1">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 transition-all duration-200 cursor-pointer font-mono text-label rounded-[5px] ${
                activeCategory === cat
                  ? "text-accent bg-accent/10"
                  : "text-muted-foreground/70 hover:text-foreground/80 hover:bg-muted-foreground/5"
              }`}
              whileHover={{ scale: 1.08, y: -1, transition: spring.snappy }}
              whileTap={{ scale: 0.95 }}
            >
              {cat === "All" ? t("blog.all") : cat}
            </motion.button>
          ))}
        </div>

        {/* Posts */}
        <MacWindow title={`${t("blog.postsTitle")} — ${activeCategory === "All" ? t("blog.all").toLowerCase() : activeCategory.toLowerCase()}`} dimLights delay={0.05}>
          <div ref={ref}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: duration.fast }}
              >
                {filtered.map((post, i) => (
                  <motion.a
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group w-full text-left flex items-start gap-3 py-3.5 border-b border-border/50 last:border-b-0 -mx-2 px-2 no-underline font-mono rounded-[6px]"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * stagger.fast, ease }}
                    whileHover={{
                      x: 4,
                      backgroundColor: "var(--accent-4)",
                      transition: { type: "spring", stiffness: 300, damping: 25 },
                    }}
                    whileTap={{ scale: 0.995 }}
                  >
                    {/* Marker */}
                    <span
                      className="text-muted-foreground/70 group-hover:text-accent/80 transition-colors duration-200 shrink-0 pt-0.5 text-mono-sm"
                    >
                      ›
                    </span>

                    {/* Title */}
                    <div className="flex-1 min-w-0 relative">
                      <span
                        className="text-foreground/75 group-hover:text-foreground transition-colors duration-200 text-sm"
                      >
                        {post.title}
                      </span>
                      <p
                        className="mt-0.5 text-muted-foreground/50 group-hover:text-muted-foreground/65 transition-colors duration-200 truncate text-mono-sm"
                      >
                        {post.summary}
                      </p>
                      {/* Hover underline -- clip-path line-draw with opacity fade */}
                      <span
                        className="blog-underline absolute top-[1.3em] left-0 right-0 h-[1px]"
                      />
                    </div>

                    {/* Date */}
                    <span
                      className="text-accent/40 shrink-0 text-label"
                    >
                      {post.date}
                    </span>
                  </motion.a>
                ))}
                {filtered.length === 0 && (
                  <p
                    className="py-8 text-center text-muted-foreground/50 font-mono text-mono"
                  >
                    {t("blog.noPosts")}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </MacWindow>
      </div>

      {/* Blog stats */}
      <BlogStats posts={posts} categories={categories} />
    </div>
    </MotionProvider>
    </ErrorBoundary>
  );
}

function BlogStats({ posts, categories }: { posts: BlogPostMeta[]; categories: string[] }) {
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

  const realCategories = categories.filter((c) => c !== "All");

  return (
    <motion.div
      ref={ref}
      className="overflow-hidden rounded-[10px] font-mono"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--window-shadow-sm)",
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: duration.slow, delay: 0.1, ease }}
      whileHover={{
        boxShadow: "var(--window-shadow)",
        y: -1,
        transition: { duration: 0.25 },
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-[10px]"
        style={{
          background: "var(--titlebar)",
          borderBottom: "1px solid var(--titlebar-border)",
        }}
      >
        <span className="text-muted-foreground/30 select-none text-2xs">$ wc -l ./posts/*</span>
      </div>
      <div className="px-5 py-4 space-y-3 text-mono-sm">
        {/* Summary row */}
        <div className="flex items-baseline gap-4 text-foreground/70">
          <span>
            <span className="text-accent/80">{posts.length}</span> posts
          </span>
          <span className="text-muted-foreground/30">|</span>
          <span>
            <span className="text-accent/80">{realCategories.length}</span> categories
          </span>
          <span className="text-muted-foreground/30">|</span>
          <span>
            <span className="text-accent/80">{stats.tagCount}</span> tags
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
                  <span className="text-muted-foreground/50 w-24 text-right truncate text-label">{cat}</span>
                  <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "var(--accent)", opacity: 0.5 }}
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${Math.max(pct, 4)}%` } : {}}
                      transition={{ duration: 0.6, delay: 0.3, ease }}
                    />
                  </div>
                  <span className="text-muted-foreground/40 w-8 text-label">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Tags cloud */}
        {stats.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-1 pt-1">
            {stats.tags.map((tag) => (
              <span key={tag} className="text-muted-foreground/35 text-label">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
