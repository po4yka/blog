import { useMemo } from "react";
import { Shell } from "@/components/MobileTerminal/Shell";
import { InfoTable, Accent } from "@/components/Terminal";
import { blogPosts } from "@/data/blogData";
import { computeBlogStats } from "@/lib/homeStats";

export function BlogStatsPanel({ delay = 0 }: { delay?: number }) {
  const stats = useMemo(() => computeBlogStats(blogPosts), []);

  const rows = [
    { label: "total", value: <span style={{ color: "var(--emphasis)", opacity: 0.9 }}>{stats.total}</span> },
    { label: "en", value: String(stats.en) },
    { label: "ru", value: String(stats.ru) },
    { label: "categories", value: String(stats.categories) },
    { label: "tags", value: String(stats.tags) },
    {
      label: "reading",
      value: (
        <span>
          {stats.totalReadingMinutes} <span style={{ opacity: 0.5 }}>min total</span>
        </span>
      ),
    },
    ...(stats.latestDate
      ? [{ label: "latest", value: <span style={{ opacity: 0.6 }}>{stats.latestDate}</span> }]
      : []),
  ];

  return (
    <Shell
      delay={delay}
      command={
        <>
          wc <Accent>--posts</Accent> ~/blog/src/content
        </>
      }
      windowTitle="blog — stats"
    >
      {() => (
        <div className="px-5 py-3.5">
          <InfoTable rows={rows} delay={delay + 0.08} />
        </div>
      )}
    </Shell>
  );
}
