import { blogPostsMeta as blogPosts } from "@/data/blogMeta";
import type { BlogPostMeta } from "@/types";
import { blogUrl, type Locale } from "@/lib/i18n";
import { readingMinutes } from "@/lib/reading";
import { PanelShell } from "./_helpers";
import { T } from "@/components/ui/T";

/** The latest post in one language; html[data-locale] shows one row. */
function PostLink({ post, lang }: { post: BlogPostMeta; lang: Locale }) {
  const minutes = readingMinutes(post);
  const iso = post.isoDate ?? undefined;
  const primaryTag = post.tags[0];

  return (
    <a
      href={blogUrl(lang, post.slug)}
      className="block group relative px-5 py-3.5"
      data-l={lang}
      lang={lang}
    >
      <span
        aria-hidden="true"
        className="absolute top-3.5 right-5 text-label text-muted-foreground-dim group-hover:text-foreground transition-colors duration-150 select-none"
      >
        <span className="uppercase"><T k="hero.latestPostRead" /></span> →
      </span>

      <p className="text-foreground/85 text-mono-sm leading-snug group-hover:text-foreground transition-colors duration-150 line-clamp-2 pr-20">
        {post.title}
      </p>

      <p className="mt-2 text-muted-foreground text-xs leading-relaxed line-clamp-2">
        {post.summary}
      </p>

      <div className="mt-3 flex items-center gap-2 flex-wrap text-label text-muted-foreground-dim">
        {iso ? (
          <time dateTime={iso}>{post.date.toUpperCase()}</time>
        ) : (
          <span>{post.date.toUpperCase()}</span>
        )}
        {minutes !== null && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              {minutes} <span className="uppercase"><T k="blogPost.min" /></span>
            </span>
          </>
        )}
        {primaryTag && (
          <>
            <span aria-hidden="true">·</span>
            <span>#{primaryTag.toLowerCase().replace(/\s+/g, "-")}</span>
          </>
        )}
      </div>
    </a>
  );
}

export function LatestPostPanel({ delay = 0 }: { delay?: number }) {
  const latest = blogPosts[0];
  if (!latest) return null;

  // Same slug in both languages; an untranslated post shows its English entry in both.
  const byLang = (lang: Locale): BlogPostMeta =>
    blogPosts.find((p) => p.slug === latest.slug && (p.lang ?? "en") === lang) ?? latest;

  return (
    <PanelShell
      label={<T k="hero.latestPostLabel" />}
      labelRight={
        <>
          <span data-l="en">{byLang("en").category}</span>{" "}
          <span data-l="ru" lang="ru">
            {byLang("ru").category}
          </span>
        </>
      }
      delay={delay}
    >
      <PostLink post={byLang("en")} lang="en" />
      <PostLink post={byLang("ru")} lang="ru" />
    </PanelShell>
  );
}
