import { useEffect, useRef, useState } from "react";

export interface ScrollState {
  scrollY: number;
  /** Percent of the scrollable document that is above the viewport, 0-100. */
  percent: number;
}

/**
 * Throttled document scroll position. One passive listener per consumer,
 * sampled at most every 200 ms; resize re-samples so the percent stays
 * truthful when the viewport height changes.
 */
export function useScrollState(): ScrollState {
  const [state, setState] = useState<ScrollState>({ scrollY: 0, percent: 0 });
  const lastCheck = useRef(0);

  useEffect(() => {
    const compute = () => {
      const scrollY = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percent =
        scrollable <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((scrollY / scrollable) * 100)));
      setState({ scrollY, percent });
    };
    const onScroll = () => {
      const now = Date.now();
      if (now - lastCheck.current < 200) return;
      lastCheck.current = now;
      compute();
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // View Transition navigations swap the document under a persisted island.
    document.addEventListener("astro:after-swap", compute);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("astro:after-swap", compute);
    };
  }, []);

  return state;
}
