import { Tag } from "@/components/Terminal";
import { blogUrl, type Locale } from "@/lib/i18n";
import { coverTransitionStyle, postTitleStyle } from "@/lib/blog/format";
import { CoverArt } from "./CoverArt";
import type { BlogPostMeta } from "@/types";

/** One row of the blog list page (not the home preview, which has its own PreviewRow). */
export function PostRow({
  post,
  lang,
  featuredLabel,
  minLabel,
}: {
  post: BlogPostMeta;
  lang: Locale;
  featuredLabel: string;
  minLabel: string;
}) {
  return (
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
          <h2 className="display-2 display-serif text-foreground/85 group-hover:text-foreground transition-colors duration-150 inline-block relative" style={postTitleStyle(post.slug)}>
            {post.title}
            <span className="blog-underline absolute left-0 right-0 bottom-[-0.15em] h-[2px]" />
          </h2>
          {post.featured && <Tag variant="highlight">{featuredLabel}</Tag>}
        </div>
        <p className="mt-3 text-[0.9375rem] leading-[1.6] text-muted-foreground line-clamp-2 max-w-[56ch]">
          {post.summary}
        </p>
        {/* The post's cover at 2 px a cell; it dissolves to full density on hover and morphs into the post header. */}
        {post.outline && (
          <CoverArt
            outline={post.outline}
            variant="strip"
            slug={post.slug}
            className="mt-4 w-full max-w-[23rem] text-foreground/45 group-hover:text-foreground/75 group-focus-visible:text-foreground/75 transition-colors duration-150"
            style={coverTransitionStyle(post.slug)}
          />
        )}
        <div className="mt-2 flex items-center gap-2 label-meta text-muted-foreground-dim">
          {/* Phones: the date joins this line so the title gets the full row width. */}
          <span className="sm:hidden">{post.date}</span>
          <span className="sm:hidden" aria-hidden="true">·</span>
          <span>{post.category}</span>
          {post.readingTime != null && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {post.readingTime} {minLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Date */}
      <span className="hidden sm:block text-muted-foreground-dim shrink-0 pt-3 text-label">
        {post.date}
      </span>
    </a>
  );
}
