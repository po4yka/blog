import { useMemo } from "react";
import { m } from "motion/react";
import { Reveal } from "@/components/ui/Reveal";
import { useInView } from "@/hooks/useInView";
import { easeStep8 } from "@/lib/motion";
import { ALL_CATEGORY, categoryPercent, computeListStats } from "@/lib/blog/filter";
import type { BlogPostMeta } from "@/types";

export function BlogStats({
  posts,
  categories,
  activeTag,
  onTagClick,
}: {
  posts: BlogPostMeta[];
  categories: string[];
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}) {
  const { ref, inView } = useInView(0.1);

  const stats = useMemo(() => computeListStats(posts), [posts]);

  const realCategories = useMemo(() => categories.filter((c) => c !== ALL_CATEGORY), [categories]);

  return (
    <Reveal ref={ref} speed="slow" delay={0.1}>
      <div
        className="flex items-center gap-3 py-2"
        style={{
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <span className="text-muted-foreground-dim select-none text-xs font-mono">$ wc -l ./posts/*</span>
      </div>
      <div className="pt-5 space-y-4 text-mono-sm">
        {/* Summary row */}
        <div className="flex items-baseline gap-4 text-foreground/80">
          <span>
            <span className="text-foreground font-medium">{posts.length}</span> posts
          </span>
          <span className="text-muted-foreground-dim" aria-hidden="true">│</span>
          <span>
            <span className="text-foreground font-medium">{realCategories.length}</span> categories
          </span>
          <span className="text-muted-foreground-dim" aria-hidden="true">│</span>
          <span>
            <span className="text-foreground font-medium">{stats.tagCount}</span> tags
          </span>
        </div>

        {/* Category breakdown */}
        {realCategories.length > 0 && (
          <div className="space-y-1">
            {realCategories.map((cat) => {
              const count = stats.catCounts[cat] ?? 0;
              const pct = categoryPercent(count, posts.length);
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-muted-foreground w-24 text-right truncate text-label">{cat}</span>
                  <div aria-hidden="true" className="flex-1 h-[2px] overflow-hidden" style={{ background: "var(--border)" }}>
                    <m.div
                      className="h-full"
                      style={{
                        background: "var(--foreground)",
                        opacity: 0.5,
                        transformOrigin: "left center",
                        width: `${Math.max(pct, 4)}%`,
                      }}
                      initial={{ scaleX: 0 }}
                      animate={inView ? { scaleX: 1 } : {}}
                      transition={{ duration: 0.6, delay: 0.3, ease: easeStep8 }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8 text-label">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Tags cloud */}
        {stats.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-1 pt-1">
            {stats.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                aria-pressed={activeTag === tag}
                className={`text-label transition-colors duration-150 cursor-pointer ${
                  activeTag === tag
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}
