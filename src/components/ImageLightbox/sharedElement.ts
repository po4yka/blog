import { flushSync } from "react-dom";

const NAME = "lightbox-figure";

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
  const clear = () => {
    trigger.style.viewTransitionName = "";
    const img = lightboxImage();
    if (img) img.style.viewTransitionName = "";
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
  const transition = document.startViewTransition(() => {
    clear();
    if (direction === "open") {
      flushSync(update);
      const img = lightboxImage();
      if (img) img.style.viewTransitionName = NAME;
    } else {
      trigger.style.viewTransitionName = NAME;
      flushSync(update);
    }
  });
  void transition.finished.then(clear, clear);
}
