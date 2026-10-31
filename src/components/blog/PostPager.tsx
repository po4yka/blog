import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { useLocale } from "@/stores/settingsStore";
import { blogUrl, type Locale } from "@/lib/i18n";
import type { AdjacentPost } from "./types";

const titleStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "14rem",
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
    <div className="pt-4 font-mono text-mono-sm grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:items-start">
      {prev ? (
        <a
          href={blogUrl(lang, prev.slug)}
          title={prev.title}
          className="inline-flex flex-col gap-0.5 text-muted-foreground hover:text-foreground transition-colors duration-150 no-underline min-w-0 sm:justify-self-start"
        >
          <span className="label-meta inline-flex items-center gap-1">
            <ArrowLeft size={10} />
            {t("blogPost.previous")}
          </span>
          <span className="text-foreground/80 hover:text-foreground" style={titleStyle}>
            {prev.title}
          </span>
          <span className="label-meta opacity-70">{prev.date}</span>
        </a>
      ) : (
        <span />
      )}
      <a
        href={listHref}
        className="inline-flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 no-underline sm:justify-self-center sm:self-center"
      >
        <ArrowUp size={12} />
        {t("blogPost.allPosts")}
      </a>
      {next ? (
        <a
          href={blogUrl(lang, next.slug)}
          title={next.title}
          className="inline-flex flex-col gap-0.5 text-muted-foreground hover:text-foreground transition-colors duration-150 no-underline min-w-0 sm:justify-self-end sm:text-right"
        >
          <span className="label-meta inline-flex items-center gap-1 sm:justify-end">
            {t("blogPost.next")}
            <ArrowRight size={10} />
          </span>
          <span className="text-foreground/80 hover:text-foreground" style={titleStyle}>
            {next.title}
          </span>
          <span className="label-meta opacity-70">{next.date}</span>
        </a>
      ) : (
        <span />
      )}
    </div>
  );
}
