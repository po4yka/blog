import type { RefObject } from "react";
import { cn } from "@/components/ui/utils";
import { TOC_MIN_ITEMS, nestToc, type TocItem } from "@/lib/blog/toc";

// --- Table of contents: nested list shared by the desktop sidebar and the mobile sheet ---

function TocLink({
  item,
  activeId,
  progress,
  touch,
  onNavigate,
}: {
  item: TocItem;
  activeId: string;
  progress: boolean;
  touch: boolean;
  onNavigate?: () => void;
}) {
  const isActive = activeId === item.id;
  return (
    <a
      href={`#${item.id}`}
      aria-current={isActive ? "location" : undefined}
      onClick={onNavigate}
      className={cn(
        "relative pl-3 font-sans text-mono leading-snug no-underline transition-colors duration-150",
        touch ? "flex min-h-11 items-center" : "block",
        isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {progress && isActive && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-px origin-top bg-emphasis"
          style={{ transform: "scaleY(var(--section-progress, 0))" }}
        />
      )}
      {item.text}
    </a>
  );
}

export function TocList({
  items,
  activeId,
  progress = false,
  touch = false,
  onNavigate,
}: {
  items: TocItem[];
  activeId: string;
  progress?: boolean;
  /** 44px link targets, for the mobile sheet. */
  touch?: boolean;
  onNavigate?: () => void;
}) {
  const link = (item: TocItem) => (
    <TocLink item={item} activeId={activeId} progress={progress} touch={touch} onNavigate={onNavigate} />
  );
  const gap = touch ? "space-y-0" : "space-y-1.5";
  return (
    <ul className={cn("list-none m-0 p-0", gap)}>
      {nestToc(items).map(({ item, children }) => (
        <li key={item.id}>
          {link(item)}
          {children.length > 0 && (
            <ul className={cn("list-none m-0 p-0 pl-3", touch ? "mt-0 space-y-0" : `mt-1.5 ${gap}`)}>
              {children.map((child) => (
                <li key={child.id}>{link(child)}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

// --- Sticky, desktop-only ---

export function Toc({
  items,
  activeId,
  label,
  progressRef,
}: {
  items: TocItem[];
  activeId: string;
  label: string;
  progressRef: RefObject<HTMLElement | null>;
}) {
  if (items.length < TOC_MIN_ITEMS) return null;

  return (
    <aside ref={progressRef} className="hidden lg:block">
      <nav aria-label={label} className="sticky top-24 space-y-3">
        <div className="label-meta text-muted-foreground-dim">{label}</div>
        <TocList items={items} activeId={activeId} progress />
      </nav>
    </aside>
  );
}
