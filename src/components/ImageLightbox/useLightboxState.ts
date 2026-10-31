import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { pickVariant, wrapIndex } from "@/lib/blog/lightbox";
import { runSharedElement } from "./sharedElement";
import type { Figure, IndexedFigure } from "./types";

export interface LightboxState {
  count: number;
  index: number | null;
  figure: Figure | null;
  isOpen: boolean;
  naturalSize: boolean;
  setNaturalSize: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: RefObject<HTMLImageElement | null>;
  thumbSrcs: string[];
  openAt: (i: number) => void;
  openFromTrigger: (i: number) => void;
  onOpenChange: (open: boolean) => void;
  nav: (delta: number) => void;
}

export function useLightboxState(
  figures: IndexedFigure[],
  effectiveDark: boolean,
  isMobile: boolean,
): LightboxState {
  const count = figures.length;
  const triggerRef = useRef<HTMLImageElement | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [naturalSize, setNaturalSize] = useState(false);
  const [figure, setFigure] = useState<Figure | null>(null);

  const thumbSrcs = useMemo(
    () => figures.map((item) => pickVariant(item, effectiveDark, isMobile)),
    [figures, effectiveDark, isMobile],
  );

  const openAt = useCallback((i: number) => {
    const nextFigure = figures[i];
    if (!nextFigure) return;
    triggerRef.current = nextFigure.img;
    setFigure({
      ...nextFigure,
      naturalWidth: nextFigure.img.naturalWidth || nextFigure.naturalWidth,
      naturalHeight: nextFigure.img.naturalHeight || nextFigure.naturalHeight,
    });
    setIndex(i);
    setNaturalSize(false);
  }, [figures]);

  useEffect(() => {
    if (index === null || count <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        openAt(wrapIndex(index, -1, count));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        openAt(wrapIndex(index, 1, count));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, openAt]);

  // Preload the previous and next figures' active variants so arrow/swipe
  // navigation feels instant.
  useEffect(() => {
    if (index === null || count <= 1 || typeof window === "undefined") return;
    const neighbourIndexes = new Set<number>([
      wrapIndex(index, -1, count),
      wrapIndex(index, 1, count),
    ]);
    neighbourIndexes.delete(index);
    const preloaders: HTMLImageElement[] = [];
    for (const i of neighbourIndexes) {
      const nextFigure = figures[i];
      if (!nextFigure) continue;
      const src = pickVariant(nextFigure, effectiveDark, isMobile);
      if (!src) continue;
      const preloader = new Image();
      preloader.decoding = "async";
      preloader.src = src;
      preloaders.push(preloader);
    }
    return () => {
      // Let the browser keep the fetched bytes in its HTTP/image cache;
      // just release our references.
      preloaders.length = 0;
    };
  }, [index, count, effectiveDark, isMobile, figures]);

  // Only a click on an inline image expands from it; ?fig= deep links and
  // in-lightbox navigation use openAt and do not animate.
  const openFromTrigger = useCallback(
    (i: number) => {
      const img = figures[i]?.img ?? null;
      runSharedElement(img, "open", () => openAt(i));
    },
    [figures, openAt],
  );

  const onOpenChange = useCallback((open: boolean) => {
    if (open) return;
    runSharedElement(triggerRef.current, "close", () => {
      setIndex(null);
      setNaturalSize(false);
    });
  }, []);

  const nav = useCallback(
    (delta: number) => {
      if (count <= 1 || index === null) return;
      openAt(wrapIndex(index, delta, count));
    },
    [count, index, openAt],
  );

  const isOpen = index !== null && figure !== null;

  return {
    count,
    index,
    figure,
    isOpen,
    naturalSize,
    setNaturalSize,
    triggerRef,
    thumbSrcs,
    openAt,
    openFromTrigger,
    onOpenChange,
    nav,
  };
}
