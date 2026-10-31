import { m, AnimatePresence } from "motion/react";
import { BootBlock, Cmd, Em } from "@/components/Terminal";
import { SectionHeader } from "@/components/SectionHeader";
import { MotionProvider } from "@/components/MotionProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useLocale } from "@/stores/settingsStore";
import type { BlogPostMeta } from "@/types";

import { ease, duration, stagger } from "@/lib/motion";
import type { Locale } from "@/lib/i18n";
import { BlogStats } from "./BlogStats";
import { ActiveTagChip, CategoryFilter } from "./Filters";
import { PostRow } from "./PostRow";
import { usePostFilters } from "./usePostFilters";

interface BlogListIslandProps {
  posts: BlogPostMeta[];
  categories: string[];
  lang?: string;
}

export function BlogListIsland({ posts, categories, lang: langProp }: BlogListIslandProps) {
  const { t } = useLocale();
  const { activeCategory, setActiveCategory, activeTag, selectTag, clearTag, filtered, featured } =
    usePostFilters(posts);
  const lang = (langProp ?? "en") as Locale;

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
                Mounted <Em>po4yka.dev/blog</Em>
              </>
            ),
          },
          {
            status: "INFO",
            text: featured ? (
              <>
                {t("blog.reading")}: <Em>posts/{featured.slug}.txt</Em>
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
          ls -lt <Em>./posts/</Em>
        </Cmd>

        <CategoryFilter categories={categories} activeCategory={activeCategory} onSelect={setActiveCategory} />

        {activeTag && <ActiveTagChip tag={activeTag} onClear={clearTag} />}

        {/* Posts list — flat, no OperatorPanel wrapping */}
        <div>
          {/* initial={false}: the server HTML and first render show the list at
              full opacity; only later filter changes fade. */}
          <AnimatePresence mode="wait" initial={false}>
            <m.ul
              key={`${activeCategory}|${activeTag ?? ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast }}
              className="list-none m-0 p-0"
            >
              {filtered.map((post, i) => (
                <m.li
                  key={post.slug}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: duration.fast, delay: Math.min(i, 5) * stagger.list, ease }}
                >
                  <PostRow
                    post={post}
                    lang={lang}
                    featuredLabel={t("blog.featured")}
                    minLabel={t("blogPost.min")}
                  />
                </m.li>
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
            </m.ul>
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
