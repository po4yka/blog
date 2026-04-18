import { useMemo } from "react";
import { blogPosts } from "@/data/blogData";
import { computeBlogStats } from "@/lib/homeStats";
import { PanelShell } from "./_helpers";

export function BlogStatsPanel({ delay = 0 }: { delay?: number }) {
  const stats = useMemo(() => computeBlogStats(blogPosts), []);

  const latest = blogPosts[0];
  const latestSlug = latest?.slug ?? null;
  const latestIso = latest?.isoDate ?? null;

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: "total",
      value: (
        <span style={{ color: "var(--emphasis)", opacity: 0.9 }}>
          {stats.total}
        </span>
      ),
    },
    {
      label: "en / ru",
      value: `${stats.en} / ${stats.ru}`,
    },
    {
      label: "categories / tags",
      value: `${stats.categories} / ${stats.tags}`,
    },
    {
      label: "reading",
      value: (
        <span>
          {stats.totalReadingMinutes}{" "}
          <span style={{ opacity: 0.5 }}>min total</span>
        </span>
      ),
    },
    ...(stats.latestDate && latestSlug
      ? [
          {
            label: "latest",
            value: (
              <a
                href={`/blog/${latestSlug}`}
                className="hover:underline underline-offset-2 decoration-dotted transition-colors duration-150"
              >
                {latestIso ? (
                  <time dateTime={latestIso}>{stats.latestDate}</time>
                ) : (
                  stats.latestDate
                )}
              </a>
            ),
          },
        ]
      : []),
  ];

  return (
    <PanelShell label="BLOG" labelRight={`${stats.total} POSTS`} delay={delay}>
      <div className="px-5 py-3 space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 min-w-0"
          >
            <span className="text-muted-foreground/80 text-mono-sm shrink-0">
              {row.label}
            </span>
            <span className="text-foreground/90 text-mono-sm text-right truncate min-w-0">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
