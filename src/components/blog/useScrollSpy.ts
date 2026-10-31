import { useState, useEffect, type RefObject } from "react";
import { activeSection, TOC_MIN_ITEMS, type TocItem } from "@/lib/blog/toc";

const READING_LINE = 0.3;

/**
 * Scroll-spy: one passive scroll + resize listener, throttled to one animation frame.
 * React state changes only with the active id; the section progress goes straight to `--section-progress` on `progressRef`.
 */
export function useScrollSpy(
  items: TocItem[],
  contentRef: RefObject<HTMLElement | null>,
  progressRef: RefObject<HTMLElement | null>,
): string {
  const [activeId, setActiveId] = useState("");
  const key = items.map((i) => i.id).join("\n");

  useEffect(() => {
    const ids = key ? key.split("\n") : [];
    if (ids.length < TOC_MIN_ITEMS) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const tops = ids.flatMap((id) => {
        const el = document.getElementById(id);
        // No layout (closed <details>, display:none) reports top 0, which would win as "active".
        return el && el.getClientRects().length > 0 ? [{ id, top: el.getBoundingClientRect().top }] : [];
      });
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const endTop = contentRef.current?.getBoundingClientRect().bottom;
      const { id, progress } = activeSection(tops, window.innerHeight * READING_LINE, atEnd, endTop);
      setActiveId(id ?? "");
      progressRef.current?.style.setProperty("--section-progress", progress.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    // Layout shifts without a scroll (font swap, image load) would leave the active id stale.
    const observer = new ResizeObserver(schedule);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [key, contentRef, progressRef]);

  return activeId;
}
