import { cn } from "@/components/ui/utils";
import { TOC_MIN_ITEMS, type TocItem } from "@/lib/blog/toc";

// --- Heading jump-nav (mobile / tablet — below the desktop TOC breakpoint) ---

export function MobileJumpNav({
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
    <nav aria-label={label} className="no-print lg:hidden -mx-1 mb-8 overflow-x-auto">
      <ul className="flex list-none gap-4 whitespace-nowrap m-0 p-0 label-meta">
        {items.map(({ id, text, level }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={activeId === id ? "location" : undefined}
              className={cn(
                "no-underline transition-colors duration-150",
                activeId === id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {level === 3 ? "› " : ""}
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
