import { useMemo } from "react";
import { blogPosts } from "@/data/blogData";
import { Cmd, Accent, Tag, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";
import { SectionHeader } from "./SectionHeader";
import { useLocale } from "@/stores/settingsStore";
import { blogUrl, type Locale } from "@/lib/i18n";

interface GroupedPost {
  slug: string;
  date: string;
  isoDate?: string;
  langs: Record<string, { title: string }>;
}

// A post is "new" based on publish recency, not the editorial `featured` flag
// (which marks curated posts and can point at an older entry).
const NEW_WINDOW_DAYS = 45;
function isRecentlyPublished(isoDate?: string): boolean {
  if (!isoDate) return false;
  const published = new Date(isoDate).getTime();
  if (Number.isNaN(published)) return false;
  const ageInDays = (Date.now() - published) / 86_400_000;
  return ageInDays >= 0 && ageInDays <= NEW_WINDOW_DAYS;
}

export function BlogPreview() {
  const { locale, t } = useLocale();

  const { previewPosts, totalPosts } = useMemo(() => {
    const bySlug = new Map<string, GroupedPost>();
    for (const p of blogPosts) {
      const lang = (p as { lang?: string }).lang ?? "en";
      let group = bySlug.get(p.slug);
      if (!group) {
        group = { slug: p.slug, date: p.date, isoDate: p.isoDate, langs: {} };
        bySlug.set(p.slug, group);
      }
      group.langs[lang] = { title: p.title };
    }
    return { previewPosts: [...bySlug.values()].slice(0, 3), totalPosts: bySlug.size };
  }, []);

  if (previewPosts.length === 0) return null;

  return (
    <MotionProvider>
    <section id="blog-preview" aria-labelledby="blog-heading" className="space-y-5">
      <SectionHeader
        number="06"
        label="WRITING"
        heading={t("blogPreview.heading")}
        meta={`${totalPosts} POSTS`}
        id="blog-heading"
      />
      <Cmd>
        find <Accent>./posts/</Accent> -name "*.md" -mtime -30 | head -3
      </Cmd>

      <MacWindow title="recent posts" sectionNumber="06" delay={0.05}>
        <div className="space-y-0">
          {previewPosts.map((post, i) => {
            const displayLang = post.langs[locale] ? locale : "en";
            const title = post.langs[displayLang]?.title ?? post.langs.en?.title ?? post.slug;
            const availLangs = Object.keys(post.langs) as Locale[];

            return (
              <a
                key={post.slug}
                href={blogUrl(displayLang as Locale, post.slug)}
                className="group flex items-start gap-0 py-2.5 border-b border-border/50 last:border-b-0 -mx-2 px-2"
              >
                <div className="flex-1 min-w-0">
                  {/* Rank line: 001 │ date │ [tag] │ title │ langs */}
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span
                      className="text-muted-foreground-dim shrink-0 font-mono text-mono-sm tabular-nums select-none"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(3, "0")}
                    </span>
                    <span className="text-muted-foreground-dim shrink-0 font-mono text-mono-sm select-none" aria-hidden="true">│</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-label">{post.date}</span>
                    {isRecentlyPublished(post.isoDate) && (
                      <>
                        <span className="text-muted-foreground-dim shrink-0 font-mono text-mono-sm select-none" aria-hidden="true">│</span>
                        <Tag variant="highlight">{t("blogPreview.new")}</Tag>
                      </>
                    )}
                    <span className="text-muted-foreground-dim shrink-0 font-mono text-mono-sm select-none" aria-hidden="true">│</span>
                    {/* Title */}
                    <div className="relative min-w-0">
                      <span className="text-foreground/80 group-hover:text-foreground transition-colors duration-200 font-sans text-mono">
                        {title}
                      </span>
                      <span className="blog-underline absolute left-0 right-0 bottom-[-0.15em] h-[2px]" />
                    </div>
                    {/* Language indicators */}
                    {availLangs.length > 1 && (
                      <>
                        <span className="text-muted-foreground-dim shrink-0 font-mono text-mono-sm select-none" aria-hidden="true">│</span>
                        <span className="text-muted-foreground-dim shrink-0 font-mono text-label select-none">
                          {availLangs.map((l) => l.toUpperCase()).join(" ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </MacWindow>

      <div>
        <a
          href="/blog"
          aria-label={t("blogPreview.viewAllLabel")}
          className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors duration-200 inline-block font-mono text-mono-sm"
        >
          {/* Visible label is decorative shell chrome (`$ find … →`); the
              aria-label carries the accessible name. Hiding the text from AT
              avoids the WCAG 2.5.3 label-in-name mismatch. */}
          <span aria-hidden="true">{t("blogPreview.viewAll")}</span>
        </a>
      </div>
    </section>
    </MotionProvider>
  );
}
