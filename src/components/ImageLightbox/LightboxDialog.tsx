import { AnimatePresence, m, type PanInfo, LazyMotion } from "motion/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, XIcon } from "lucide-react";

import { useLocale, useSettings } from "@/stores/settingsStore";
import { duration, ease } from "@/lib/motion";
import { pickVariant, swipeDirection } from "@/lib/blog/lightbox";
import type { LightboxState } from "./useLightboxState";
import { Thumbnails } from "./Thumbnails";
import { usePanZoom } from "./usePanZoom";

const loadMaxFeatures = () => import("@/lib/motionFeaturesMax").then((mod) => mod.default);

interface Props {
  state: LightboxState;
  effectiveDark: boolean;
  isMobile: boolean;
}

export function LightboxDialog({ state, effectiveDark, isMobile }: Props) {
  const { t } = useLocale();
  const { reduceMotion } = useSettings();
  const {
    count,
    index,
    figure,
    isOpen,
    naturalSize,
    setNaturalSize,
    triggerRef,
    thumbSrcs,
    openAt,
    onOpenChange,
    nav,
  } = state;
  const { wrapperRef, isPanning, consumeSuppressedClick, handlers } = usePanZoom(naturalSize);

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
          // drag needs domMax on top of MotionProvider's domAnimation; it loads
          // here, the first time the lightbox opens, not with every post.
          <LazyMotion key="lightbox" features={loadMaxFeatures} strict>
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <m.div
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
              <m.div
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

                <m.div
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
                  {...handlers}
                  drag={count > 1 && !naturalSize ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  dragMomentum={false}
                  onDragEnd={(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
                    if (count <= 1 || naturalSize) return;
                    const direction = swipeDirection(info.offset.x, info.velocity.x);
                    if (direction !== 0) nav(direction);
                  }}
                  onClick={(event) => {
                    if (event.target === event.currentTarget) onOpenChange(false);
                  }}
                >
                  <img
                    src={pickVariant(figure, effectiveDark, isMobile)}
                    alt={figure.alt}
                    data-lightbox-image=""
                    onClick={(event) => {
                      event.stopPropagation();
                      if (consumeSuppressedClick()) return;
                      if (canZoom) setNaturalSize((v) => !v);
                    }}
                    onKeyDown={(event) => {
                      if (!canZoom) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        setNaturalSize((v) => !v);
                      }
                    }}
                    role={canZoom ? "button" : undefined}
                    tabIndex={canZoom ? 0 : undefined}
                    aria-label={canZoom ? t("blogPost.imageLightbox.toggleZoom") : undefined}
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
                </m.div>

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
                  <Thumbnails
                    thumbSrcs={thumbSrcs}
                    count={count}
                    index={index}
                    openAt={openAt}
                    label={t("blogPost.imageLightbox.thumbnailsLabel")}
                    goToLabel={t("blogPost.imageLightbox.goToFigure")}
                  />
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 sm:left-4 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[2px] border border-border bg-card/75 text-muted-foreground transition-colors duration-150 hover:text-foreground active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
                      style={{ outlineColor: "var(--emphasis)" }}
                    >
                      <ChevronLeft size={18} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => nav(1)}
                      aria-label={t("blogPost.imageLightbox.next")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 sm:right-4 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[2px] border border-border bg-card/75 text-muted-foreground transition-colors duration-150 hover:text-foreground active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px]"
                      style={{ outlineColor: "var(--emphasis)" }}
                    >
                      <ChevronRight size={18} strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </m.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
          </LazyMotion>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
