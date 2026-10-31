import { useLocale } from "@/stores/settingsStore";
import { blogUrl, type Locale } from "@/lib/i18n";
import { pickRelated } from "@/lib/blog/format";
import { CopyLinkButton, CopyMarkdownButton } from "./CopyButtons";
import type { RelatedPost } from "./types";

// Footer — author micro-block + related posts
export function PostFooter({
  slug,
  lang,
  related,
}: {
  slug: string;
  lang: Locale;
  related?: RelatedPost[];
}) {
  const { t } = useLocale();
  const relatedPosts = pickRelated(related);

  return (
    <div className="mt-8 pt-4 border-t border-border space-y-6" style={{ maxWidth: "46rem" }}>
      {/* Author row */}
      <div className="space-y-2">
        <div className="font-sans text-[0.9375rem] leading-snug">
          <span className="text-foreground font-medium">Nikita Pochaev</span>
          <span className="text-muted-foreground"> — {t("blogPost.authorRole")}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-label">
          <a
            href="https://github.com/po4yka"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 no-underline"
          >
            github.com/po4yka
            <span className="sr-only"> ({t("links.opensNewWindow")})</span>
          </a>
          <a
            href="https://linkedin.com/in/pochaev-nikita/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 no-underline"
          >
            linkedin.com/in/pochaev-nikita
            <span className="sr-only"> ({t("links.opensNewWindow")})</span>
          </a>
          <span className="no-print inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <CopyLinkButton />
            <CopyMarkdownButton slug={slug} lang={lang} />
          </span>
        </div>
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <div className="space-y-3">
          <div className="label-meta">{t("blogPost.related")}</div>
          <ul className="list-none m-0 p-0 divide-y divide-rule border-t border-b border-rule">
            {relatedPosts.map((rp) => (
              <li key={rp.slug}>
                <a
                  href={blogUrl(lang, rp.slug)}
                  className="group flex flex-col gap-1 py-3 no-underline sm:flex-row sm:items-baseline sm:gap-4"
                >
                  <span className="label-meta text-muted-foreground-dim shrink-0 sm:w-24 truncate">
                    {rp.category}
                  </span>
                  <span className="flex-1 font-sans text-[0.9375rem] leading-snug text-foreground/80 group-hover:text-foreground transition-colors duration-150 min-w-0 sm:truncate">
                    {rp.title}
                  </span>
                  <span className="label-meta text-muted-foreground-dim shrink-0 tabular-nums">
                    {rp.isoDate ? <time dateTime={rp.isoDate}>{rp.date}</time> : <span>{rp.date}</span>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
