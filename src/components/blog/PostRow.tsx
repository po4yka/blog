import { Tag } from "@/components/Terminal";
import { blogUrl, type Locale } from "@/lib/i18n";
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
          <h2 className="display-2 display-serif text-foreground/85 group-hover:text-foreground transition-colors duration-150 inline-block relative">
            {post.title}
            <span className="blog-underline absolute left-0 right-0 bottom-[-0.15em] h-[2px]" />
          </h2>
          {post.featured && <Tag variant="highlight">{featuredLabel}</Tag>}
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
                {post.readingTime} {minLabel}
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
  );
}
