import { useEffect, useState } from "react";

import { DARK_QUERY, MOBILE_QUERY } from "@/lib/blog/lightbox";
import { useSettings } from "@/stores/settingsStore";

function matches(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

/** The theme and viewport that decide which <source> variant the lightbox shows. */
export function useVariantContext(): { effectiveDark: boolean; isMobile: boolean } {
  const { theme, resolvedTheme } = useSettings();
  const [systemDark, setSystemDark] = useState<boolean>(() => matches(DARK_QUERY));
  const [isMobile, setIsMobile] = useState<boolean>(() => matches(MOBILE_QUERY));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const darkQuery = window.matchMedia(DARK_QUERY);
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
  return { effectiveDark, isMobile };
}
