import { useCallback, useEffect, useState, type RefObject } from "react";
import { COVER_W, coverReadPosition, coverSections, parseOutline } from "@/lib/cover";
import type { TocItem } from "@/lib/blog/toc";

const READING_LINE = 0.3;
/** Dim level of the unread part once the reader has started; before that the cover keeps full ink. */
const UNREAD = "0.35";
const FIGURES = ".blog-figure, .anatomy-figure";

/** The post's figures in reading order: an AnatomyFigure holds a BlogFigure as its still, which is not a figure of its own. */
const figuresIn = (root: HTMLElement | null) =>
  [...(root?.querySelectorAll<HTMLElement>(FIGURES) ?? [])].filter((f) => !f.parentElement?.closest(FIGURES));

/**
 * Ties the cover art to the article (rule A8, DESIGN.md "Post Covers"):
 * - writes `--read` (0 to 1 along the cover) and `--unread` on every target, one
 *   animation frame per scroll, so the read part of each cover keeps full ink;
 * - reports the figure that crosses the middle band of the viewport, in reading order;
 * - turns a click on the cover into a jump to the section or the figure.
 * Figures link only when the page has exactly as many as the outline, so an index never points at the wrong one.
 */
export function useCoverMap(
  outline: string | undefined,
  sections: TocItem[],
  contentRef: RefObject<HTMLElement | null>,
  targets: RefObject<HTMLElement | null>[],
) {
  const [activeFigure, setActiveFigure] = useState<number | null>(null);
  const columns = outline ? coverSections(outline) : [];
  const figureCount = outline ? parseOutline(outline).filter((i) => i.kind === "f").length : 0;
  const ids = sections.length === columns.length ? sections.map((s) => s.id) : [];
  const key = `${ids.join("\n")}|${columns.join(",")}`;

  useEffect(() => {
    if (!outline) return;
    const cols = key.split("|")[1]!.split(",").filter(Boolean).map(Number);
    const anchorIds = key.split("|")[0]!.split("\n").filter(Boolean);
    let frame = 0;
    const update = () => {
      frame = 0;
      const content = contentRef.current;
      if (!content) return;
      const box = content.getBoundingClientRect();
      const anchors = [{ top: box.top, x: 0 }];
      anchorIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getClientRects().length > 0) anchors.push({ top: el.getBoundingClientRect().top, x: cols[i]! / COVER_W });
      });
      anchors.push({ top: box.bottom, x: 1 });
      const line = window.innerHeight * READING_LINE;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const read = atEnd ? 1 : coverReadPosition(line, anchors);
      for (const t of targets) {
        t.current?.style.setProperty("--read", read.toFixed(4));
        t.current?.style.setProperty("--unread", line > box.top ? UNREAD : "1");
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
    // targets is a stable list of refs owned by the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outline, key, contentRef]);

  useEffect(() => {
    const figures = figuresIn(contentRef.current);
    if (figureCount === 0 || figures.length !== figureCount) return;
    const visible = new Set<number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = figures.indexOf(e.target as HTMLElement);
          if (e.isIntersecting) visible.add(i);
          else visible.delete(i);
        }
        setActiveFigure(visible.size > 0 ? Math.min(...visible) : null);
      },
      { rootMargin: "-35% 0px -35% 0px" },
    );
    figures.forEach((f) => io.observe(f));
    return () => io.disconnect();
  }, [figureCount, contentRef]);

  const onBlock = useCallback(
    (section: number, figure: number | null) => {
      const figures = figuresIn(contentRef.current);
      if (figure !== null && figures.length === figureCount) {
        figures[figure]?.scrollIntoView({ block: "center" });
        return;
      }
      const id = ids[section];
      if (id) window.location.hash = id;
      else contentRef.current?.scrollIntoView({ block: "start" });
    },
    // ids follows key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, figureCount, contentRef],
  );

  return { activeFigure, onBlock };
}
