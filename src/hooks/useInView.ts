import { useEffect, useRef, useState } from "react";
import { observe } from "./observerManager";

/**
 * Returns { ref, inView } — triggers once when element enters viewport,
 * then stops observing (fire-once reveal pattern).
 * Uses the shared IntersectionObserver pool.
 */
export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  // Track whether we've already triggered to avoid re-subscribing
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || triggered.current) return;

    const unobserve = observe(
      el,
      (isIntersecting) => {
        if (isIntersecting) {
          setInView(true);
          triggered.current = true;
          unobserve();
        }
      },
      threshold
    );

    return unobserve;
  }, [threshold]);

  return { ref, inView };
}

