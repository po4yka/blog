import { cn } from "@/components/ui/utils";
import { TOC_MIN_ITEMS, type TocItem } from "@/lib/blog/toc";

// --- Table of contents (sticky, desktop-only) ---

export function Toc({
  items,
  activeId,
  label,
}: {
  items: TocItem[];
  activeId: string;
  label: string;
}) {
  if (items.length < TOC_MIN_ITEMS) return null;

  return (
    <aside className="hidden lg:block">
      <nav aria-label={label} className="sticky top-24 space-y-3">
        <div className="label-meta text-muted-foreground-dim">{label}</div>
        <ul className="list-none m-0 p-0 space-y-1.5">
          {items.map(({ id, text, level }) => {
            const isActive = activeId === id;
            return (
              <li key={id} className={cn("flex items-baseline gap-1", level === 3 && "pl-3")}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 font-mono text-muted-foreground-dim transition-opacity duration-150",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                >
                  {"›"}
                </span>
                <a
                  href={`#${id}`}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "block font-sans text-[13px] leading-snug no-underline transition-colors duration-150",
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
