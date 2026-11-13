import { Fragment } from "react";
import { blogPostsMeta as blogPosts } from "@/data/blogMeta";
import { Em, Tag } from "./Terminal";
import { SectionHeader } from "./SectionHeader";
import { Reveal } from "./ui/Reveal";
import { T } from "./ui/T";
import { blogUrl, t, type Locale } from "@/lib/i18n";
import { CoverArt } from "./blog/CoverArt";

interface GroupedPost {
  slug: string;
  date: string;
  isoDate?: string;
  langs: Partial<Record<Locale, { title: string; outline?: string }>>;
}

// A post is "new" based on publish recency, not the editorial `featured` flag
// (which marks curated posts and can point at an older entry). The section is
// static, so "now" is the build time; every deploy refreshes it.
const NEW_WINDOW_DAYS = 45;
function isRecentlyPublished(isoDate?: string): boolean {
  if (!isoDate) return false;
  const published = new Date(isoDate).getTime();
  if (Number.isNaN(published)) return false;
  const ageInDays = (Date.now() - published) / 86_400_000;
  return ageInDays >= 0 && ageInDays <= NEW_WINDOW_DAYS;
}

function groupPosts() {
  const bySlug = new Map<string, GroupedPost>();
  for (const p of blogPosts) {
    const lang = ((p as { lang?: string }).lang ?? "en") as Locale;
    let group = bySlug.get(p.slug);
    if (!group) {
      group = { slug: p.slug, date: p.date, isoDate: p.isoDate, langs: {} };
      bySlug.set(p.slug, group);
    }
    group.langs[lang] = { title: p.title, outline: p.outline };
  }
  return { previewPosts: [...bySlug.values()].slice(0, 3), totalPosts: bySlug.size };
}

const ROW_CLASS =
  "group flex items-start gap-0 py-5 -mx-2 px-2 hover:bg-card transition-colors duration-150 rounded-[2px]";

/** One post row in one language: a meta line, the title in the blog serif, and the post's cover. */
function PreviewRow({ post, index, lang, dataL }: { post: GroupedPost; index: number; lang: Locale; dataL?: Locale }) {
  const entry = post.langs[lang];
  const title = entry?.title ?? post.slug;
  const availLangs = Object.keys(post.langs) as Locale[];
  return (
    <a href={blogUrl(lang, post.slug)} className={ROW_CLASS} data-l={dataL} lang={lang}>
      <div className="flex-1 min-w-0">
        {/* Meta line: 001 │ date │ [new] │ langs */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className="text-muted-foreground-dim shrink-0 font-mono text-mono-sm tabular-nums select-none"
            aria-hidden="true"
          >
            {String(index + 1).padStart(3, "0")}
          </span>
          <span className="text-muted-foreground-dim shrink-0 font-mono text-mono-sm select-none" aria-hidden="true">│</span>
          <span className="text-muted-foreground shrink-0 font-mono text-label">{post.date}</span>
          {isRecentlyPublished(post.isoDate) && (
            <>
              <span className="text-muted-foreground-dim shrink-0 font-mono text-mono-sm select-none" aria-hidden="true">│</span>
              <Tag variant="highlight">
                <T k="blogPreview.new" />
              </Tag>
            </>
          )}
          {/* Available languages, pinned right; the row links to `lang`, shown brighter.
              Passive label: the other language is one locale switch away. */}
          {availLangs.length > 1 && (
            <span className="ml-auto shrink-0 font-mono text-label select-none" aria-hidden="true">
              {availLangs.map((l, i) => (
                <span key={l}>
                  {i > 0 && <span className="text-muted-foreground-dim">{" · "}</span>}
                  <span className={l === lang ? "text-muted-foreground" : "text-muted-foreground-dim"}>{l}</span>
                </span>
              ))}
            </span>
          )}
        </div>
        {/* Title in the blog voice, one step below the /blog index titles. */}
        <h3 className="mt-2 m-0 display-serif text-foreground/85 group-hover:text-foreground transition-colors duration-(--dur-fast) inline-block relative max-w-[46rem]" style={{ fontSize: "var(--step-3)" }}>
          {title}
          <span className="blog-underline absolute left-0 right-0 bottom-[-0.15em] h-[2px]" />
        </h3>
        {/* The post's cover (rule A8), as on /blog. No view-transition name here: only the /blog list marks the cover as arrived. */}
        {entry?.outline && (
          <CoverArt
            outline={entry.outline}
            variant="strip"
            slug={post.slug}
            className="mt-3 w-full max-w-[46rem] text-foreground/45 group-hover:text-foreground/75 group-focus-visible:text-foreground/75 transition-colors duration-(--dur-fast)"
          />
        )}
      </div>
    </a>
  );
}

/** Server-only (no client directive): static HTML with both languages, no JS. */
export function BlogPreview() {
  const { previewPosts, totalPosts } = groupPosts();
  if (previewPosts.length === 0) return null;

  return (
    <section id="blog-preview" aria-labelledby="blog-heading" className="space-y-5">
      <SectionHeader
        number="06"
        label="WRITING"
        heading={<T k="blogPreview.heading" />}
        meta={`${totalPosts} POSTS`}
        id="blog-heading"
      />
      {/* A static prompt line: the section ships no JS, so no click-to-copy. */}
      {/* Kept quieter than the post titles: the prompt is chrome, the titles are content. */}
      <Reveal speed="fast" className="col-body flex items-baseline gap-2 font-mono text-mono-sm min-w-0">
        <span className="select-none text-muted-foreground" aria-hidden="true">
          $
        </span>
        <span className="text-muted-foreground min-w-0 wrap-anywhere">
          ls -t <Em>./posts/</Em> | head -3
        </span>
      </Reveal>

      <div className="col-body space-y-0">
        {previewPosts.map((post, i) => (
          // The border sits on the wrapper, so the last post keeps last:border-b-0
          // whichever language anchor is visible.
          <div key={post.slug} className="border-b border-border last:border-b-0">
            {post.langs.ru && post.langs.en ? (
              <>
                <PreviewRow post={post} index={i} lang="en" dataL="en" />
                <PreviewRow post={post} index={i} lang="ru" dataL="ru" />
              </>
            ) : (
              <PreviewRow post={post} index={i} lang={post.langs.en ? "en" : "ru"} />
            )}
          </div>
        ))}
      </div>

      <div className="col-body pt-1">
        {(["en", "ru"] as const).map((lang) => (
          <Fragment key={lang}>
            <a
              href={blogUrl(lang)}
              data-l={lang}
              lang={lang === "ru" ? "ru" : undefined}
              className="text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors duration-200 inline-flex items-center min-h-[44px] font-mono text-mono-sm"
            >
              {/* The accessible name starts with the visible text (WCAG 2.5.3). */}
              {t(lang, "blogPreview.viewAll")}
              <span className="sr-only">
                {" — "}
                {t(lang, "blogPreview.viewAllLabel")}
              </span>
            </a>{" "}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
