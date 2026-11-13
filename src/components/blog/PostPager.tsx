import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { useLocale } from "@/stores/settingsStore";
import { blogUrl, type Locale } from "@/lib/i18n";
import type { AdjacentPost } from "./types";

const titleStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "100%",
} as const;

// Navigation — three-slot: prev | back-to-index | next
export function PostPager({
  prev,
  next,
  lang,
  listHref,
}: {
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
  lang: Locale;
  listHref: string;
}) {
  const { t } = useLocale();

  return (
    <nav
      aria-label={t("blogPost.postNav")}
      className="panel p-4 text-mono-sm grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4 sm:items-start"
    >
      {prev ? (
        <a
          href={blogUrl(lang, prev.slug)}
          className="inline-flex flex-col gap-0.5 text-muted-foreground hover:text-foreground transition-colors duration-150 no-underline min-w-0 max-w-full sm:justify-self-start"
        >
          <span className="label-meta inline-flex items-center gap-1">
            <ArrowLeft size={10} />
            {t("blogPost.previous")}
          </span>
          <span className="font-sans text-foreground/80 hover:text-foreground" style={titleStyle}>
            {prev.title}
          </span>
          <span className="label-meta">{prev.date}</span>
        </a>
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
      <a
        href={listHref}
        className="inline-flex items-center justify-center gap-1.5 min-h-11 sm:min-h-0 font-mono text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 no-underline sm:justify-self-center sm:self-center"
      >
        <ArrowUp size={12} />
        {t("blogPost.allPosts")}
      </a>
      {next ? (
        <a
          href={blogUrl(lang, next.slug)}
          className="inline-flex flex-col gap-0.5 text-muted-foreground hover:text-foreground transition-colors duration-150 no-underline min-w-0 max-w-full sm:justify-self-end sm:text-right"
        >
          <span className="label-meta inline-flex items-center gap-1 sm:justify-end">
            {t("blogPost.next")}
            <ArrowRight size={10} />
          </span>
          <span className="font-sans text-foreground/80 hover:text-foreground" style={titleStyle}>
            {next.title}
          </span>
          <span className="label-meta">{next.date}</span>
        </a>
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
    </nav>
  );
}
