import { useEffect, useRef } from "react";

import { parseFigParam } from "@/lib/blog/lightbox";

/**
 * Keeps the URL in sync with the lightbox state (?fig=N, 1-indexed) so readers
 * can share direct links and a refresh reopens the same figure. Uses
 * replaceState: back goes to the previous page, not out of the lightbox;
 * dismissal stays on Escape / close button. The write effect must stay before
 * the initial-read effect: it early-returns until the initial check ran.
 */
export function useFigureUrl(index: number | null, count: number, openAt: (i: number) => void): void {
  // On first render with a non-empty image list, honour ?fig=N in the URL.
  const didInitialURLCheckRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const currentFig = url.searchParams.get("fig");
    const desiredFig = index !== null ? String(index + 1) : null;
    if (currentFig === desiredFig) return;
    if (!didInitialURLCheckRef.current && currentFig !== null && desiredFig === null) return;
    if (desiredFig !== null) {
      url.searchParams.set("fig", desiredFig);
    } else {
      url.searchParams.delete("fig");
    }
    window.history.replaceState(null, "", url.toString());
  }, [index]);

  useEffect(() => {
    if (didInitialURLCheckRef.current) return;
    if (count === 0) return;
    if (typeof window === "undefined") return;
    didInitialURLCheckRef.current = true;
    const n = parseFigParam(new URL(window.location.href).searchParams.get("fig"), count);
    if (n !== null) {
      // Legit external→React sync on mount (URL is the external state);
      // not a "derived state" case the rule is meant to prevent.
      openAt(n);
    }
  }, [count, openAt]);
}
