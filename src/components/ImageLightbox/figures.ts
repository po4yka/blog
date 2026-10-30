import { useEffect, useState, type RefObject } from "react";

import { parseSource, resolveCaption, type VariantSource } from "@/lib/blog/lightbox";
import { useLocale } from "@/stores/settingsStore";
import type { IndexedFigure } from "./types";

function extractSources(img: HTMLImageElement): {
  sources: VariantSource[];
  fallbackSrc: string;
} {
  const picture = img.closest("picture");
  const sources: VariantSource[] = [];
  if (picture) {
    picture.querySelectorAll<HTMLSourceElement>("source").forEach((sourceEl) => {
      const source = parseSource({
        srcset: sourceEl.getAttribute("srcset") ?? "",
        media: sourceEl.getAttribute("media") ?? "",
        type: sourceEl.getAttribute("type"),
        theme: sourceEl.dataset.theme,
        viewport: sourceEl.dataset.viewport,
      });
      if (source) sources.push(source);
    });
  }
  const fallbackSrc = img.getAttribute("src") || img.currentSrc || "";
  return { sources, fallbackSrc };
}

function readFigure(img: HTMLImageElement, root: HTMLDivElement): IndexedFigure {
  const { sources, fallbackSrc } = extractSources(img);
  const picture = img.closest("picture");
  const alt = img.alt ?? "";

  const figcaptionText = img.closest("figure")?.querySelector("figcaption")?.textContent?.trim();

  // The sibling caption paragraph (`*Figure N. ...*`) only applies to raw
  // <picture> posts, so siblingText stays null without a <picture>.
  let siblingText: string | null = null;
  if (picture) {
    let block: Element = picture;
    while (block.parentElement && block.parentElement !== root) {
      block = block.parentElement;
    }
    const sibling = block.nextElementSibling;
    if (sibling instanceof HTMLElement && sibling.tagName === "P") {
      siblingText = sibling.textContent?.trim() ?? "";
    }
  }

  return {
    img,
    sources,
    fallbackSrc,
    alt,
    caption: resolveCaption({ alt, figcaptionText, siblingText }),
    naturalWidth: img.naturalWidth || 0,
    naturalHeight: img.naturalHeight || 0,
  };
}

/** Marks every content image as a lightbox trigger and reads its figure data. */
export function useFigureRegistry(
  contentRef: RefObject<HTMLDivElement | null>,
  t: ReturnType<typeof useLocale>["t"],
): IndexedFigure[] {
  const [figures, setFigures] = useState<IndexedFigure[]>([]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const list = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
    const openLabel = t("blogPost.imageLightbox.openImage");
    list.forEach((img, i) => {
      img.setAttribute("role", "button");
      img.setAttribute("tabindex", "0");
      img.dataset.lightboxIndex = String(i);
      if (!img.getAttribute("aria-label")) {
        img.setAttribute("aria-label", img.alt ? `${openLabel}: ${img.alt}` : openLabel);
      }
    });
    setFigures(list.map((img) => readFigure(img, root)));

    return () => {
      list.forEach((img) => {
        img.removeAttribute("role");
        img.removeAttribute("tabindex");
        img.removeAttribute("aria-label");
        delete img.dataset.lightboxIndex;
      });
    };
  }, [contentRef, t]);

  return figures;
}

/** Delegated click / Enter / Space handling for the registered trigger images. */
export function useFigureTriggers(
  contentRef: RefObject<HTMLDivElement | null>,
  openAt: (i: number) => void,
): void {
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const imgFromTarget = (target: EventTarget | null): HTMLImageElement | null => {
      if (!(target instanceof HTMLImageElement)) return null;
      return target.dataset.lightboxIndex ? target : null;
    };

    const onClick = (e: MouseEvent) => {
      const img = imgFromTarget(e.target);
      if (!img) return;
      e.preventDefault();
      openAt(Number(img.dataset.lightboxIndex));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const img = imgFromTarget(e.target);
      if (!img) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openAt(Number(img.dataset.lightboxIndex));
      }
    };

    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKeyDown);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKeyDown);
    };
  }, [contentRef, openAt]);
}
