import { useLocale } from "@/stores/settingsStore";
import type { Locale } from "@/lib/i18n";
import { alsoAsLinks, formatIsoDate, isUpdated, postTitleStyle } from "@/lib/blog/format";
import type { PostMeta } from "./types";
import { COVER_H, COVER_W, coverCaption, coverPath } from "@/lib/cover";
import { maskStyle } from "@/components/ui/utils";

export function PostHeader({
  post,
  slug,
  lang,
  listHref,
}: {
  post: PostMeta;
  slug: string;
  lang: Locale;
  listHref: string;
}) {
  const { t, locale } = useLocale();
  const tagsLabel = t("blogPost.tags");
  const showUpdated = isUpdated(post);

  return (
    <header className="mb-10" style={{ maxWidth: "46rem" }}>
      <h1 className="display-2 display-serif text-foreground" style={postTitleStyle(slug)}>
        {post.title}
      </h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 label-meta">
        <span>
          {t("blogPost.author")} <span className="text-foreground font-medium">Nikita Pochaev</span>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {t("blogPost.date")}{" "}
          <time
            {...(post.isoDate ? { dateTime: post.isoDate } : {})}
            className="text-foreground/80"
          >
            {post.date}
          </time>
        </span>
        {showUpdated && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              {t("blogPost.updated")}{" "}
              <time dateTime={post.isoDateModified} className="text-foreground/80">
                {formatIsoDate(post.isoDateModified!)}
              </time>
            </span>
          </>
        )}
        <span aria-hidden="true">·</span>
        <span>
          {t("blogPost.category")} <span className="text-foreground/80">{post.category}</span>
        </span>
      </div>
      {/* Tag list in header — clickable, routes to list with ?tag= filter */}
      <ul
        role="list"
        aria-label={tagsLabel}
        className="mt-4 flex flex-wrap items-center gap-3 list-none m-0 p-0"
      >
        {post.tags.map((tag) => (
          <li key={tag} role="listitem">
            <a
              href={`${listHref}?tag=${encodeURIComponent(tag)}`}
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 no-underline font-mono text-label"
            >
              #{tag}
            </a>
          </li>
        ))}
      </ul>
      {/* Machine-readable twins of this post. They exist for coding
          agents and feed readers; showing them makes that part of
          the site visible to people too. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 label-meta text-muted-foreground-dim">
        <span>{t("blogPost.alsoAs")}</span>
        {alsoAsLinks(slug, lang).map((f, i) => (
          <span key={f.label} className="flex items-center gap-x-3">
            {i > 0 && <span aria-hidden="true">·</span>}
            <a
              href={f.href}
              className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors duration-150 no-underline"
            >
              {f.label}
            </a>
          </span>
        ))}
      </div>
      {/* Generative cover (rule A8): 1-bit art from this post's own fields; the caption names them. */}
      {post.wordCount !== undefined && post.headings && post.isoDate && (
        <figure className="mt-8 mb-0 mx-0">
          <div
            aria-hidden="true"
            className="w-full text-foreground/45"
            style={{ aspectRatio: `${COVER_W} / ${COVER_H}`, ...maskStyle(coverPath(lang, slug)) }}
          />
          <figcaption className="mt-2 label-meta text-muted-foreground-dim">
            {t("blogPost.cover")}: {coverCaption({ slug, wordCount: post.wordCount, headings: post.headings, isoDate: post.isoDate }, locale)}
          </figcaption>
        </figure>
      )}
    </header>
  );
}
