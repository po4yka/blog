import { useLocale } from "@/stores/settingsStore";
import type { Locale } from "@/lib/i18n";
import { alsoAsLinks, formatIsoDate, isUpdated, postTitleStyle } from "@/lib/blog/format";
import type { PostMeta } from "./types";
import { useMemo, useState, type RefObject } from "react";
import { useClientValue } from "@/hooks/useClientValue";
import { COVER_W, coverArt, coverCaption, coverSections, countsLabel, sectionCounts } from "@/lib/cover";
import type { TocItem } from "@/lib/blog/toc";
import { CoverArt } from "./CoverArt";
import { coverTransitionStyle } from "@/lib/blog/format";

export function PostHeader({
  post,
  slug,
  lang,
  listHref,
  sections = [],
  coverRef,
  activeFigure = null,
  onBlock,
}: {
  post: PostMeta;
  slug: string;
  lang: Locale;
  listHref: string;
  /** The h2 items of the TOC; the cover numbers them under their columns. */
  sections?: TocItem[];
  /** Gets `--read` and `--unread` from useCoverMap. */
  coverRef?: RefObject<HTMLElement | null>;
  activeFigure?: number | null;
  onBlock?: (section: number, figure: number | null) => void;
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
        <PostCover
          slug={slug}
          outline={post.outline}
          caption={`${t("blogPost.cover")}: ${coverCaption({ wordCount: post.wordCount, outline: post.outline }, locale)}`}
          sections={sections}
          label={t("blogPost.coverSections")}
          locale={locale}
          coverRef={coverRef}
          activeFigure={activeFigure}
          onBlock={onBlock}
        />
      )}
    </header>
  );
}

/** Fewest columns between two numbered sections; a closer one keeps its rule on the cover but no number. */
const MIN_LABEL_GAP = 12;

/**
 * The cover, its section numbers and its caption. Pointing at a section (on the
 * art or its number) dims the others and swaps the caption for that section's
 * title and contents; both captions share one grid cell, so nothing moves.
 */
function PostCover({
  slug,
  outline,
  caption,
  sections,
  label,
  locale,
  coverRef,
  activeFigure,
  onBlock,
}: {
  slug: string;
  outline: string;
  caption: string;
  sections: TocItem[];
  label: string;
  locale: Locale;
  coverRef?: RefObject<HTMLElement | null>;
  activeFigure: number | null;
  onBlock?: (section: number, figure: number | null) => void;
}) {
  const [hot, setHot] = useState<number | null>(null);
  // Decode is set after mount: a scrambled frame before hydration ends is a mismatch (src/lib/decode.ts).
  const mounted = useClientValue(() => true, false);
  const art = useMemo(() => coverArt(outline), [outline]);
  const columns = coverSections(outline);
  // The numbers pair by position; when the counts differ they would point at the wrong headings.
  const paired = sections.length === columns.length ? sections : [];
  const hotSection = hot !== null ? paired[hot] : undefined;
  const hotCounts = hot !== null ? countsLabel(sectionCounts(art, hot), locale) : "";

  return (
    <figure ref={coverRef} className="post-cover mt-8 mb-0 mx-0">
      <CoverArt
        outline={outline}
        variant="header"
        slug={slug}
        className="cover-print w-full text-foreground/60"
        style={coverTransitionStyle(slug)}
        hot={hot}
        activeFigure={activeFigure}
        onHot={paired.length > 0 ? setHot : undefined}
        onBlock={onBlock}
      />
      {paired.length > 0 && (
        <nav aria-label={label} className="relative mt-1 h-4 label-meta">
          {paired.map((section, i) => {
            const x = columns[i]!;
            if (i > 0 && x - columns[i - 1]! < MIN_LABEL_GAP) return null;
            const n = String(i + 1).padStart(2, "0");
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-label={`${n} ${section.text}`}
                // The ::before pads the hit area to 44 px high without moving the digits.
                className={`absolute top-0 no-underline transition-colors duration-150 before:absolute before:-inset-x-1.5 before:-inset-y-3.5 before:content-[''] ${hot === i ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                style={{ left: `${(x / COVER_W) * 100}%` }}
                onPointerEnter={() => setHot(i)}
                onPointerLeave={() => setHot(null)}
                onFocus={() => setHot(i)}
                onBlur={() => setHot(null)}
              >
                {/* Decode owns the aria-label of its element, so it runs on an inner span and the link keeps its name. */}
                <span data-decode={mounted || undefined}>{n}</span>
              </a>
            );
          })}
        </nav>
      )}
      <figcaption className="mt-2 grid label-meta">
        <span className={`[grid-area:1/1] text-muted-foreground-dim transition-opacity duration-100 ${hotSection ? "opacity-0" : ""}`}>
          {caption}
        </span>
        <span
          aria-hidden="true"
          className={`[grid-area:1/1] truncate text-foreground/80 transition-opacity duration-100 ${hotSection ? "" : "opacity-0"}`}
        >
          {hotSection && `§${String(hot! + 1).padStart(2, "0")} ${hotSection.text}${hotCounts ? ` · ${hotCounts}` : ""}`}
        </span>
      </figcaption>
    </figure>
  );
}
