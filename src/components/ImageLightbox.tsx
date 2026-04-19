"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";

import { useLocale, useSettings } from "@/stores/settingsStore";
import { duration, ease } from "@/lib/motion";

interface Props {
  contentRef: RefObject<HTMLDivElement | null>;
}

interface Figure {
  src: string;
  alt: string;
  naturalWidth: number;
  naturalHeight: number;
}

export function ImageLightbox({ contentRef }: Props) {
  const { t } = useLocale();
  const { reduceMotion } = useSettings();

  const imgsRef = useRef<HTMLImageElement[]>([]);
  const [count, setCount] = useState(0);
  const [index, setIndex] = useState<number | null>(null);
  const [naturalSize, setNaturalSize] = useState(false);
  const [figure, setFigure] = useState<Figure | null>(null);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
    imgsRef.current = imgs;
    setCount(imgs.length);

    const openLabel = t("blogPost.imageLightbox.openImage");
    imgs.forEach((img, i) => {
      img.setAttribute("role", "button");
      img.setAttribute("tabindex", "0");
      img.dataset.lightboxIndex = String(i);
      if (!img.getAttribute("aria-label")) {
        img.setAttribute("aria-label", img.alt ? `${openLabel}: ${img.alt}` : openLabel);
      }
    });

    return () => {
      imgs.forEach((img) => {
        img.removeAttribute("role");
        img.removeAttribute("tabindex");
        img.removeAttribute("aria-label");
        delete img.dataset.lightboxIndex;
      });
    };
  }, [contentRef, t]);

  const openAt = useCallback((i: number) => {
    const img = imgsRef.current[i];
    if (!img) return;
    setFigure({
      src: img.currentSrc || img.src,
      alt: img.alt ?? "",
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0,
    });
    setIndex(i);
    setNaturalSize(false);
  }, []);

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

  useEffect(() => {
    if (index === null || count <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        openAt((index - 1 + count) % count);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        openAt((index + 1) % count);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, openAt]);

  const onOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setIndex(null);
      setNaturalSize(false);
    }
  }, []);

  const nav = useCallback(
    (delta: number) => {
      if (count <= 1 || index === null) return;
      openAt((index + delta + count) % count);
    },
    [count, index, openAt],
  );

  const isOpen = index !== null && figure !== null;

  const canZoom =
    typeof window !== "undefined" &&
    figure !== null &&
    figure.naturalWidth > 0 &&
    (figure.naturalWidth > window.innerWidth * 0.95 ||
      figure.naturalHeight > window.innerHeight * 0.85);

  const fadeDuration = reduceMotion ? 0 : duration.fast;
  const fadeTransition = { duration: fadeDuration, ease: [...ease] };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {isOpen && figure && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeTransition}
                style={{ backgroundColor: "rgba(11, 11, 12, 0.92)" }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 py-10 sm:px-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeTransition}
                onClick={(event) => {
                  if (event.target === event.currentTarget) onOpenChange(false);
                }}
              >
                <DialogPrimitive.Title className="sr-only">
                  {t("blogPost.imageLightbox.dialogLabel")}
                </DialogPrimitive.Title>

                <motion.div
                  className="relative flex items-center justify-center"
                  style={{
                    maxWidth: "95vw",
                    maxHeight: "85vh",
                    width: naturalSize ? "95vw" : "auto",
                    height: naturalSize ? "85vh" : "auto",
                    overflow: naturalSize ? "auto" : "visible",
                    touchAction: "pinch-zoom",
                  }}
                  drag={count > 1 && !naturalSize ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  dragMomentum={false}
                  onDragEnd={(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
                    if (count <= 1 || naturalSize) return;
                    const distance = info.offset.x;
                    const velocity = info.velocity.x;
                    const distanceThreshold = 80;
                    const velocityThreshold = 500;
                    if (distance < -distanceThreshold || velocity < -velocityThreshold) {
                      nav(1);
                    } else if (distance > distanceThreshold || velocity > velocityThreshold) {
                      nav(-1);
                    }
                  }}
                  onClick={(event) => {
                    if (event.target === event.currentTarget) onOpenChange(false);
                  }}
                >
                  <img
                    src={figure.src}
                    alt={figure.alt}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (canZoom) setNaturalSize((v) => !v);
                    }}
                    draggable={false}
                    style={{
                      display: "block",
                      maxWidth: naturalSize ? "none" : "95vw",
                      maxHeight: naturalSize ? "none" : "85vh",
                      width: naturalSize ? "auto" : "auto",
                      height: "auto",
                      objectFit: "contain",
                      cursor: canZoom ? (naturalSize ? "zoom-out" : "zoom-in") : "default",
                      borderRadius: 2,
                      userSelect: "none",
                    }}
                  />
                </motion.div>

                {figure.alt && (
                  <div
                    className="pointer-events-none mt-4 max-w-[70ch] px-4 text-center font-sans text-[13px] leading-snug text-muted-foreground"
                  >
                    {figure.alt}
                  </div>
                )}

                {count > 1 && (
                  <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground tabular-nums">
                    {String((index ?? 0) + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                  </div>
                )}

                <DialogPrimitive.Close
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[2px] text-muted-foreground transition-colors duration-150 hover:text-foreground active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
                  style={{ outlineColor: "var(--emphasis)" }}
                  aria-label={t("blogPost.imageLightbox.close")}
                >
                  <XIcon size={18} strokeWidth={1.5} />
                </DialogPrimitive.Close>

                {count > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => nav(-1)}
                      aria-label={t("blogPost.imageLightbox.previous")}
                      className="absolute left-2 top-1/2 -translate-y-1/2 sm:left-4 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[2px] border border-border bg-card/75 text-muted-foreground backdrop-blur-sm transition-colors duration-150 hover:text-foreground active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
                      style={{ outlineColor: "var(--emphasis)" }}
                    >
                      <ChevronLeft size={18} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => nav(1)}
                      aria-label={t("blogPost.imageLightbox.next")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 sm:right-4 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[2px] border border-border bg-card/75 text-muted-foreground backdrop-blur-sm transition-colors duration-150 hover:text-foreground active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
                      style={{ outlineColor: "var(--emphasis)" }}
                    >
                      <ChevronRight size={18} strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
