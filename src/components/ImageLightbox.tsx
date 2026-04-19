"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";

import { useLocale, useSettings } from "@/stores/settingsStore";
import { duration, ease } from "@/lib/motion";

interface Props {
  contentRef: RefObject<HTMLDivElement | null>;
}

interface VariantSource {
  srcset: string;
  requiresDark: boolean;
  requiresMobile: boolean;
  mimeType: string | null;
}

interface Figure {
  sources: VariantSource[];
  fallbackSrc: string;
  alt: string;
  caption: string;
  naturalWidth: number;
  naturalHeight: number;
}

const MOBILE_QUERY = "(max-width: 640px)";

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getIsMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

// Prefer PNG for the lightbox's single <img> render — broad decoder support
// across browsers and image tooling. Fall back to the first format-agnostic
// match (AVIF/WebP), then to the <img>'s fallback src.
function pickVariant(
  figure: { sources: VariantSource[]; fallbackSrc: string },
  isDark: boolean,
  isMobile: boolean,
): string {
  const matches = figure.sources.filter(
    (s) => !(s.requiresDark && !isDark) && !(s.requiresMobile && !isMobile) && s.srcset,
  );
  const png = matches.find((s) => s.mimeType === "image/png" || s.mimeType === null);
  if (png) return png.srcset;
  const first = matches[0];
  if (first) return first.srcset;
  return figure.fallbackSrc;
}

function extractSources(img: HTMLImageElement): {
  sources: VariantSource[];
  fallbackSrc: string;
} {
  const picture = img.closest("picture");
  const sources: VariantSource[] = [];
  if (picture) {
    picture.querySelectorAll<HTMLSourceElement>("source").forEach((sourceEl) => {
      const srcset = sourceEl.getAttribute("srcset") ?? "";
      if (!srcset) return;
      const media = sourceEl.getAttribute("media") ?? "";
      const type = sourceEl.getAttribute("type");
      // BlogFigure tags sources with data-theme / data-viewport so the lightbox
      // can pick the right variant regardless of how the runtime rewrites
      // `media` to sync with the site's manual theme toggle.
      const themeAttr = sourceEl.dataset.theme;
      const viewportAttr = sourceEl.dataset.viewport;
      const requiresDark =
        themeAttr === "dark" ||
        (themeAttr === undefined && /prefers-color-scheme:\s*dark/i.test(media));
      const requiresMobile =
        viewportAttr === "mobile" ||
        (viewportAttr === undefined && /max-width:\s*640px/i.test(media));
      sources.push({
        srcset,
        requiresDark,
        requiresMobile,
        mimeType: type,
      });
    });
  }
  const fallbackSrc = img.getAttribute("src") || img.currentSrc || "";
  return { sources, fallbackSrc };
}

export function ImageLightbox({ contentRef }: Props) {
  const { t } = useLocale();
  const { reduceMotion, theme, resolvedTheme } = useSettings();
  const [systemDark, setSystemDark] = useState<boolean>(getSystemPrefersDark);
  const [isMobile, setIsMobile] = useState<boolean>(getIsMobileViewport);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const onDark = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    const onMobile = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    darkQuery.addEventListener("change", onDark);
    mobileQuery.addEventListener("change", onMobile);
    return () => {
      darkQuery.removeEventListener("change", onDark);
      mobileQuery.removeEventListener("change", onMobile);
    };
  }, []);

  const effectiveDark = theme === "system" ? systemDark : resolvedTheme === "dark";

  const [imgs, setImgs] = useState<HTMLImageElement[]>([]);
  const count = imgs.length;
  const triggerRef = useRef<HTMLImageElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const [naturalSize, setNaturalSize] = useState(false);
  const [figure, setFigure] = useState<Figure | null>(null);

  const thumbSrcs = useMemo(
    () => imgs.map((img) => pickVariant(extractSources(img), effectiveDark, isMobile)),
    [imgs, effectiveDark, isMobile],
  );

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
    setImgs(list);

    return () => {
      list.forEach((img) => {
        img.removeAttribute("role");
        img.removeAttribute("tabindex");
        img.removeAttribute("aria-label");
        delete img.dataset.lightboxIndex;
      });
    };
  }, [contentRef, t]);

  const openAt = useCallback((i: number) => {
    const img = imgs[i];
    if (!img) return;
    triggerRef.current = img;
    const { sources, fallbackSrc } = extractSources(img);
    const picture = img.closest("picture");
    const alt = img.alt ?? "";

    // Prefer <figcaption> inside the enclosing <figure> (the BlogFigure
    // component emits this). Fall back to the sibling caption paragraph
    // pattern (`*Figure N. ...*` — raw-<picture> posts), then to alt.
    let caption = alt;
    const figure = img.closest("figure");
    const figcaption = figure?.querySelector("figcaption");
    const captionFromFigure = figcaption?.textContent?.trim();
    if (captionFromFigure && captionFromFigure.length > 0) {
      caption = captionFromFigure;
    } else {
      const root = contentRef.current;
      if (picture && root) {
        let block: Element = picture;
        while (block.parentElement && block.parentElement !== root) {
          block = block.parentElement;
        }
        const sibling = block.nextElementSibling;
        if (sibling instanceof HTMLElement && sibling.tagName === "P") {
          const text = sibling.textContent?.trim() ?? "";
          if (text.length > 0) caption = text;
        }
      }
    }

    setFigure({
      sources,
      fallbackSrc,
      alt,
      caption,
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0,
    });
    setIndex(i);
    setNaturalSize(false);
  }, [contentRef, imgs]);

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

  // Keep the URL in sync with the lightbox state (?fig=N, 1-indexed)
  // so readers can share direct links and page refresh reopens the same
  // figure. Uses replaceState — back button goes to the previous page,
  // not out of the lightbox; dismissal stays on Escape / close button.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const currentFig = url.searchParams.get("fig");
    const desiredFig = index !== null ? String(index + 1) : null;
    if (currentFig === desiredFig) return;
    if (desiredFig !== null) {
      url.searchParams.set("fig", desiredFig);
    } else {
      url.searchParams.delete("fig");
    }
    window.history.replaceState(null, "", url.toString());
  }, [index]);

  // On first render with a non-empty image list, honour ?fig=N in the URL.
  const didInitialURLCheckRef = useRef(false);
  useEffect(() => {
    if (didInitialURLCheckRef.current) return;
    if (count === 0) return;
    if (typeof window === "undefined") return;
    didInitialURLCheckRef.current = true;
    const fig = new URL(window.location.href).searchParams.get("fig");
    if (fig === null) return;
    const n = parseInt(fig, 10) - 1;
    if (Number.isFinite(n) && n >= 0 && n < count) {
      // Legit external→React sync on mount (URL is the external state);
      // not a "derived state" case the rule is meant to prevent.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      openAt(n);
    }
  }, [count, openAt]);

  // Preload the previous and next figures' active variants so arrow/swipe
  // navigation feels instant.
  useEffect(() => {
    if (index === null || count <= 1 || typeof window === "undefined") return;
    const neighbourIndexes = new Set<number>([
      (index - 1 + count) % count,
      (index + 1) % count,
    ]);
    neighbourIndexes.delete(index);
    const preloaders: HTMLImageElement[] = [];
    for (const i of neighbourIndexes) {
      const img = imgs[i];
      if (!img) continue;
      const src = pickVariant(extractSources(img), effectiveDark, isMobile);
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
  }, [index, count, effectiveDark, isMobile, imgs]);

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
  const fadeTransition = { duration: fadeDuration, ease };

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

            <DialogPrimitive.Content
              asChild
              forceMount
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                const trigger = triggerRef.current;
                if (!trigger) return;
                trigger.focus({ preventScroll: true });
                trigger.scrollIntoView({
                  block: "nearest",
                  behavior: reduceMotion ? "auto" : "smooth",
                });
              }}
            >
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
                  ref={wrapperRef}
                  className="relative flex items-center justify-center"
                  style={{
                    maxWidth: "95vw",
                    maxHeight: count > 1 ? "72vh" : "85vh",
                    width: naturalSize ? "95vw" : "auto",
                    height: naturalSize ? (count > 1 ? "72vh" : "85vh") : "auto",
                    overflow: naturalSize ? "auto" : "visible",
                    touchAction: "pinch-zoom",
                    cursor: naturalSize ? (isPanning ? "grabbing" : "grab") : undefined,
                  }}
                  onPointerDown={(event) => {
                    if (!naturalSize) return;
                    if (event.pointerType !== "mouse") return;
                    const wrapper = wrapperRef.current;
                    if (!wrapper) return;
                    wrapper.setPointerCapture(event.pointerId);
                    panStateRef.current = {
                      startX: event.clientX,
                      startY: event.clientY,
                      scrollLeft: wrapper.scrollLeft,
                      scrollTop: wrapper.scrollTop,
                      moved: false,
                    };
                    setIsPanning(true);
                  }}
                  onPointerMove={(event) => {
                    const state = panStateRef.current;
                    const wrapper = wrapperRef.current;
                    if (!state || !wrapper) return;
                    const dx = event.clientX - state.startX;
                    const dy = event.clientY - state.startY;
                    if (!state.moved && Math.abs(dx) + Math.abs(dy) > 3) {
                      state.moved = true;
                    }
                    wrapper.scrollLeft = state.scrollLeft - dx;
                    wrapper.scrollTop = state.scrollTop - dy;
                  }}
                  onPointerUp={(event) => {
                    const state = panStateRef.current;
                    if (!state) return;
                    wrapperRef.current?.releasePointerCapture(event.pointerId);
                    const moved = state.moved;
                    panStateRef.current = null;
                    setIsPanning(false);
                    if (moved) {
                      suppressClickRef.current = true;
                    }
                  }}
                  onPointerCancel={() => {
                    panStateRef.current = null;
                    setIsPanning(false);
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
                    src={pickVariant(figure, effectiveDark, isMobile)}
                    alt={figure.alt}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (suppressClickRef.current) {
                        suppressClickRef.current = false;
                        return;
                      }
                      if (canZoom) setNaturalSize((v) => !v);
                    }}
                    draggable={false}
                    style={{
                      display: "block",
                      maxWidth: naturalSize ? "none" : "95vw",
                      maxHeight: naturalSize ? "none" : count > 1 ? "72vh" : "85vh",
                      width: naturalSize ? "auto" : "auto",
                      height: "auto",
                      objectFit: "contain",
                      cursor: naturalSize
                        ? (isPanning ? "grabbing" : "grab")
                        : canZoom
                          ? "zoom-in"
                          : "default",
                      borderRadius: 2,
                      userSelect: "none",
                    }}
                  />
                </motion.div>

                {figure.caption && (
                  <div
                    className="pointer-events-none mt-4 max-w-[70ch] px-4 text-center font-sans text-[13px] leading-snug text-muted-foreground"
                  >
                    {figure.caption}
                  </div>
                )}

                {count > 1 && (
                  <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground tabular-nums">
                    {String((index ?? 0) + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                  </div>
                )}

                {count > 1 && (
                  <div
                    role="tablist"
                    aria-label={t("blogPost.imageLightbox.thumbnailsLabel")}
                    className="mt-3 flex max-w-[90vw] flex-wrap items-center justify-center gap-1.5"
                  >
                    {Array.from({ length: count }).map((_, i) => {
                      const src = thumbSrcs[i];
                      if (!src) return null;
                      const isActive = i === index;
                      return (
                        <button
                          key={i}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          aria-label={`${t("blogPost.imageLightbox.goToFigure")} ${i + 1}`}
                          onClick={() => openAt(i)}
                          className="relative h-10 w-14 overflow-hidden rounded-[2px] border transition-opacity duration-150 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
                          style={{
                            borderColor: isActive ? "var(--emphasis)" : "var(--border)",
                            opacity: isActive ? 1 : 0.55,
                            outlineColor: "var(--emphasis)",
                            background: "var(--card)",
                          }}
                        >
                          {src && (
                            <img
                              src={src}
                              alt=""
                              aria-hidden="true"
                              draggable={false}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </button>
                      );
                    })}
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
