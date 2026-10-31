import { useEffect, useRef, type RefObject } from "react";
import type { Locale } from "@/lib/i18n";

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

/** Fires the `blog-read-complete` analytics event once, when the end marker is fully visible. */
export function useReadComplete(endRef: RefObject<HTMLDivElement | null>, slug: string, lang: Locale) {
  const firedRef = useRef(false);

  useEffect(() => {
    const el = endRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (firedRef.current) return;
        if (entries[0]?.isIntersecting) {
          firedRef.current = true;
          window.umami?.track("blog-read-complete", { slug, lang });
          observer.disconnect();
        }
      },
      { threshold: 1.0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [endRef, slug, lang]);
}
