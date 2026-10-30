import { useEffect, useState } from "react";
import { observe } from "./observerManager";

/**
 * Returns { ref, inView, element } — triggers once when element enters viewport,
 * then stops observing (fire-once reveal pattern).
 * Uses the shared IntersectionObserver pool.
 *
 * `ref` is a callback ref, so observation starts whenever the element attaches,
 * including components that render a placeholder first and the target later.
 */
export function useInView(threshold = 0.15) {
  const [element, setElement] = useState<Element | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!element || inView) return;

    const unobserve = observe(
      element,
      (isIntersecting) => {
        if (isIntersecting) {
          setInView(true);
          unobserve();
        }
      },
      threshold
    );

    return unobserve;
  }, [element, inView, threshold]);

  return { ref: setElement, inView, element };
}
