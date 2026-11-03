import { useLocale } from "@/stores/settingsStore";
import type { Locale } from "@/lib/i18n";
import { alsoAsLinks, formatIsoDate, isUpdated, postTitleStyle } from "@/lib/blog/format";
import type { PostMeta } from "./types";
import { COVER_H, COVER_W, coverCaption, coverPath, coverSections } from "@/lib/cover";
import type { TocItem } from "@/lib/blog/toc";
import { maskStyle } from "@/components/ui/utils";

export function PostHeader({
  post,
  slug,
  lang,
  listHref,
  sections = [],
}: {
  post: PostMeta;
  slug: string;
  lang: Locale;
  listHref: string;
  /** The h2 items of the TOC; the cover numbers them under their columns. */
  sections?: TocItem[];
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
      {/* Generative cover (rule A8): a minimap of this post's blocks; the numbers link to its sections. */}
      {post.wordCount !== undefined && post.outline && (
        <figure className="mt-8 mb-0 mx-0">
          <div
            aria-hidden="true"
            className="w-full text-foreground/60"
            style={{ aspectRatio: `${COVER_W} / ${COVER_H}`, ...maskStyle(coverPath(lang, slug)) }}
          />
          <CoverSections columns={coverSections(post.outline)} sections={sections} label={t("blogPost.toc")} />
          <figcaption className="mt-2 label-meta text-muted-foreground-dim">
            {t("blogPost.cover")}: {coverCaption({ wordCount: post.wordCount, outline: post.outline }, locale)}
          </figcaption>
        </figure>
      )}
    </header>
  );
}

/** Fewest columns between two numbered sections; a closer one keeps its rule on the cover but no number. */
const MIN_LABEL_GAP = 12;

/** Section numbers under the cover, each at the column of its h2 rule and linking to that heading. */
function CoverSections({ columns, sections, label }: { columns: number[]; sections: TocItem[]; label: string }) {
  // The numbers pair by position; when the counts differ they would point at the wrong headings.
  if (sections.length !== columns.length) return null;
  const labels = sections.reduce<{ section: TocItem; x: number; n: string }[]>((out, section, i) => {
    const x = columns[i]!;
    const prev = out[out.length - 1];
    if (!prev || x - prev.x >= MIN_LABEL_GAP) out.push({ section, x, n: String(i + 1).padStart(2, "0") });
    return out;
  }, []);
  if (labels.length === 0) return null;
  return (
    <nav aria-label={label} className="relative mt-1 h-4 label-meta">
      {labels.map(({ section, x, n }) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          title={section.text}
          aria-label={`${n} ${section.text}`}
          className="absolute top-0 text-muted-foreground no-underline hover:text-foreground transition-colors duration-150"
          style={{ left: `${(x / COVER_W) * 100}%` }}
        >
          {n}
        </a>
      ))}
    </nav>
  );
}
