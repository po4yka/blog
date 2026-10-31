import { m, AnimatePresence } from "motion/react";
import { BootBlock, Cmd, Em } from "@/components/Terminal";
import { SectionHeader } from "@/components/SectionHeader";
import { MotionProvider } from "@/components/MotionProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useLocale } from "@/stores/settingsStore";
import type { BlogPostMeta } from "@/types";

import { T, TCount } from "@/components/ui/T";
import { pluralize } from "@/lib/plural";
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

const POST_FORMS: Parameters<typeof pluralize>[2] = {
  en: ["post", "posts"],
  ru: ["пост", "поста", "постов"],
};

export function BlogListIsland({ posts, categories, lang: langProp }: BlogListIslandProps) {
  const { t, locale } = useLocale();
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
        heading={<T k="blog.heading" />}
        meta={<TCount n={posts.length} forms={POST_FORMS} />}
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
                <T k="terminal.mounted" /> <Em>{lang === "ru" ? "po4yka.dev/blog/ru" : "po4yka.dev/blog"}</Em>
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

        {/* Announces the result count after a filter change (live regions skip their first render). */}
        <p role="status" className="sr-only">
          {filtered.length === 0 ? t("blog.noPosts") : pluralize(filtered.length, locale, POST_FORMS)}
        </p>

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
            </m.ul>
          </AnimatePresence>
          {filtered.length === 0 && <BootBlock lines={[{ status: "WARN", text: t("blog.noPosts") }]} />}
        </div>
      </div>

      {/* Blog stats */}
      <BlogStats posts={posts} activeTag={activeTag} onTagClick={selectTag} />
    </div>
    </MotionProvider>
    </ErrorBoundary>
  );
}
