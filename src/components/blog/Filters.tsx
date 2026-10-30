import { useLocale } from "@/stores/settingsStore";

/** Category filter — flat row separated by │ */
export function CategoryFilter({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}) {
  const { t } = useLocale();

  return (
    <div role="group" aria-label={t("blog.filterByCategory")} className="flex flex-wrap items-center gap-0 pl-1">
      {categories.map((cat, i) => (
        <span key={cat} className="flex items-center">
          {i > 0 && (
            <span className="text-muted-foreground-dim px-2 select-none" aria-hidden="true">
              │
            </span>
          )}
          <button
            onClick={() => onSelect(cat)}
            aria-pressed={activeCategory === cat}
            className={`inline-flex items-center px-1.5 py-0.5 min-h-11 sm:min-h-0 transition-colors duration-150 cursor-pointer text-label ${
              activeCategory === cat
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat === "All" ? t("blog.all") : cat}
          </button>
        </span>
      ))}
    </div>
  );
}

/** Active tag filter chip */
export function ActiveTagChip({ tag, onClear }: { tag: string; onClear: () => void }) {
  const { t } = useLocale();

  return (
    <div className="pl-1 flex flex-wrap items-center gap-2 font-mono text-label">
      <span className="text-muted-foreground-dim">{t("blogPost.filteredBy")}</span>
      <span className="text-foreground/80">#{tag}</span>
      <button
        onClick={onClear}
        aria-label={t("blogPost.clearFilter")}
        className="text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer inline-flex items-center justify-center min-h-11 min-w-11 -my-3 sm:min-h-0 sm:min-w-0 sm:my-0"
      >
        ×
      </button>
    </div>
  );
}
