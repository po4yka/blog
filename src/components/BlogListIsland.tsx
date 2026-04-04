import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BootBlock, Cmd, Accent, MacWindow } from "./Terminal";
import { useInView } from "@/hooks/useInView";
import { MotionProvider } from "./MotionProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { useLocale } from "@/stores/settingsStore";

const CpuGraph = lazy(() => import("./Decorations").then(m => ({ default: m.CpuGraph })));
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
                  : "text-muted-foreground/40 hover:text-foreground/60 hover:bg-muted-foreground/5"
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
                      backgroundColor: "rgba(145, 132, 247, 0.04)",
                      transition: { type: "spring", stiffness: 300, damping: 25 },
                    }}
                    whileTap={{ scale: 0.995 }}
                  >
                    {/* Marker */}
                    <span
                      className="text-muted-foreground/40 group-hover:text-accent/60 transition-colors duration-200 shrink-0 pt-0.5 text-mono-sm"
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

      {/* Decorative CPU history graph */}
      <Suspense fallback={null}>
        <CpuGraph delay={0.1} />
      </Suspense>
    </div>
    </MotionProvider>
    </ErrorBoundary>
  );
}
