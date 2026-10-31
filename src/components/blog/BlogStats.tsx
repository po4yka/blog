import { useId, useMemo } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { uniqueTags } from "@/lib/blog/filter";
import { useLocale } from "@/stores/settingsStore";
import type { BlogPostMeta } from "@/types";

/** Tag filter list: one button per tag, wired to the list's tag filter. */
export function BlogStats({
  posts,
  activeTag,
  onTagClick,
}: {
  posts: BlogPostMeta[];
  activeTag: string | null;
  onTagClick: (tag: string) => void;
}) {
  const { t } = useLocale();
  const labelId = useId();
  const tags = useMemo(() => uniqueTags(posts), [posts]);

  if (tags.length === 0) return null;

  return (
    <Reveal speed="slow" delay={0.1}>
      <div className="space-y-2 border-t border-rule pt-4">
        <div id={labelId} className="label-meta text-muted-foreground-dim">
          {t("blog.tags")}
        </div>
        <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-x-2 gap-y-1">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              aria-pressed={activeTag === tag}
              className={`inline-flex items-center min-h-11 sm:min-h-0 text-label transition-colors duration-150 cursor-pointer ${
                activeTag === tag ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
