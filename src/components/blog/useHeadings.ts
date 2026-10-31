import { useState, useEffect, type RefObject } from "react";
import { TOC_MIN_ITEMS, toTocItems, pickActiveId, type TocItem } from "@/lib/blog/toc";

// --- Heading collection + scroll-spy ---
// Shared by the desktop sticky TOC and the mobile/tablet jump-nav so both
// read from one IntersectionObserver instead of each running its own.

export function useHeadings(contentRef: RefObject<HTMLDivElement | null>) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const hs = Array.from(el.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id]"));
    setItems(
      toTocItems(
        hs.map((h) => {
          const clone = h.cloneNode(true) as HTMLElement;
          clone.querySelectorAll(".heading-anchor").forEach((a) => a.remove());
          return { id: h.id, tagName: h.tagName, text: clone.textContent ?? "" };
        }),
      ),
    );
    if (hs.length < TOC_MIN_ITEMS) return;

    const io = new IntersectionObserver(
      (entries) => {
        const id = pickActiveId(
          entries.map((e) => ({
            isIntersecting: e.isIntersecting,
            top: e.boundingClientRect.top,
            id: (e.target as HTMLElement).id,
          })),
        );
        if (id !== null) setActiveId(id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    hs.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [contentRef]);

  return { items, activeId };
}
