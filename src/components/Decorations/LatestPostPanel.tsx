import { blogPosts } from "@/data/blogData";
import { PanelShell } from "./_helpers";

export function LatestPostPanel({ delay = 0 }: { delay?: number }) {
  const latest = blogPosts[0];
  if (!latest) return null;

  const minutes =
    latest.readingTime ??
    (latest.wordCount ? Math.max(1, Math.round(latest.wordCount / 200)) : null);

  const iso = latest.isoDate ?? undefined;
  const primaryTag = latest.tags[0];

  return (
    <PanelShell label="LATEST POST" labelRight={latest.category} delay={delay}>
      <a
        href={`/blog/${latest.slug}`}
        className="block group relative px-5 py-3.5"
        aria-label={`Read: ${latest.title}`}
      >
        <span
          aria-hidden="true"
          className="absolute top-3.5 right-5 text-label text-muted-foreground-dim group-hover:text-foreground transition-colors duration-150 select-none"
        >
          READ →
        </span>

        <p className="text-foreground/85 text-mono-sm leading-snug group-hover:text-foreground transition-colors duration-150 line-clamp-2 pr-14">
          {latest.title}
        </p>

        <p className="mt-2 text-muted-foreground text-xs leading-relaxed line-clamp-2">
          {latest.summary}
        </p>

        <div className="mt-3 flex items-center gap-2 flex-wrap text-label text-muted-foreground-dim">
          {iso ? (
            <time dateTime={iso}>{latest.date.toUpperCase()}</time>
          ) : (
            <span>{latest.date.toUpperCase()}</span>
          )}
          {minutes !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span>{minutes} MIN</span>
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
    </PanelShell>
  );
}
