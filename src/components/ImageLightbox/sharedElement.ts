import { flushSync } from "react-dom";

const NAME = "lightbox-figure";
const DECODE_CAP_MS = 150;

function canAnimate(trigger: HTMLImageElement | null): trigger is HTMLImageElement {
  if (typeof document === "undefined" || !trigger) return false;
  if (typeof document.startViewTransition !== "function") return false;
  const { motion, effects } = document.documentElement.dataset;
  if (motion === "reduce" || (effects ?? "full") !== "full") return false;
  // An off-screen thumbnail has nothing to expand from or shrink to.
  const rect = trigger.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}

function lightboxImage(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-lightbox-image]");
}

// The latest transition. A close during an open's decode wait skips the open; the open's
// late cleanup must not strip the name the close just set.
let current: ViewTransition | null = null;

/**
 * Runs a synchronous state change inside a View Transition that moves one
 * shared name between the inline image and the lightbox image. Falls back to
 * calling `update` directly. The name is on exactly one element per snapshot
 * (a duplicate would skip the transition) and is removed when it finishes.
 */
export function runSharedElement(
  trigger: HTMLImageElement | null,
  direction: "open" | "close",
  update: () => void,
): void {
  if (!canAnimate(trigger)) {
    update();
    return;
  }
  const reset = () => {
    trigger.style.viewTransitionName = "";
    const img = lightboxImage();
    if (img) {
      img.style.viewTransitionName = "";
      // Undo the close path's hide, in case the node is reused by a quick reopen.
      img.style.visibility = "";
    }
  };
  if (direction === "close") {
    const img = lightboxImage();
    if (!img) {
      update();
      return;
    }
    img.style.viewTransitionName = NAME;
  } else {
    trigger.style.viewTransitionName = NAME;
  }
  const transition = document.startViewTransition(async () => {
    trigger.style.viewTransitionName = "";
    const old = lightboxImage();
    if (old) old.style.viewTransitionName = "";
    if (direction === "open") {
      flushSync(update);
      const img = lightboxImage();
      if (img instanceof HTMLImageElement) {
        img.style.viewTransitionName = NAME;
        // The new snapshot needs real dimensions; the variant may differ from the thumbnail. Capped so a slow image cannot stall the page.
        await Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, DECODE_CAP_MS))]);
      }
    } else {
      trigger.style.viewTransitionName = NAME;
      flushSync(update);
      // The exiting lightbox image is still mounted for its fade; hide it so it does not double the shrinking figure.
      const img = lightboxImage();
      if (img) img.style.visibility = "hidden";
    }
  });
  current = transition;
  const done = () => {
    if (current !== transition) return;
    current = null;
    reset();
  };
  // A skipped transition rejects `ready`; `finished` still resolves and runs the cleanup.
  transition.ready.catch(() => {});
  void transition.finished.then(done, done);
}
