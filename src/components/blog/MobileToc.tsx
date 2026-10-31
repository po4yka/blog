import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { TOC_MIN_ITEMS, type TocItem } from "@/lib/blog/toc";
import { TocList } from "./Toc";

// --- Mobile TOC (below lg): fixed bottom bar showing the active section, and a native <dialog> bottom sheet ---

export function MobileToc({
  items,
  activeId,
  label,
  openLabel,
  closeLabel,
}: {
  items: TocItem[];
  activeId: string;
  label: string;
  openLabel: string;
  closeLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // The wrapper is display:none from lg up, which would leave an open modal dialog invisible but still inert.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) dialogRef.current?.close();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (items.length < TOC_MIN_ITEMS) return null;

  const current = items.find((i) => i.id === activeId) ?? items[0];
  const close = () => dialogRef.current?.close();

  return (
    <div className="no-print lg:hidden">
      {/* Page-end clearance for this bar is `body:has(.mobile-toc-bar)` in index.css; md+ sits above the 28px StatusLine. */}
      <div className="mobile-toc-bar fixed inset-x-0 bottom-0 z-40 flex h-[calc(2.75rem+env(safe-area-inset-bottom))] items-start gap-3 border-t border-rule bg-background pl-4 pr-1 label-meta md:bottom-7">
        <span className="min-w-0 flex-1 self-center truncate text-muted-foreground">{current?.text}</span>
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="h-11 shrink-0 cursor-pointer px-3 text-foreground underline underline-offset-4 active:opacity-70"
        >
          {openLabel}
        </button>
      </div>
      <dialog
        ref={dialogRef}
        aria-labelledby="mobile-toc-title"
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="m-0 mt-auto w-full max-w-none max-h-[70vh] overflow-y-auto overscroll-contain rounded-t-[2px] border border-b-0 border-border bg-background p-0 text-foreground backdrop:bg-black/50"
        style={{ boxShadow: "var(--overlay-shadow)" }}
      >
        <div className="flex items-center justify-between border-b border-rule pl-4">
          <h2 id="mobile-toc-title" className="label-meta m-0 text-muted-foreground-dim">{label}</h2>
          <button
            type="button"
            onClick={close}
            aria-label={closeLabel}
            className="flex h-11 w-11 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={label} className="p-4">
          <TocList items={items} activeId={activeId} onNavigate={close} />
        </nav>
      </dialog>
    </div>
  );
}
