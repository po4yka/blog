import { useState, useEffect, useCallback } from "react";
import { parseResume, resumeAction, resumeKey, resumeScrollTop } from "@/lib/blog/resume";

// --- Reading position memory ---

// Stores how far the reader got (as a percent, so it survives font-size and
// viewport changes) and offers a one-click resume on the next visit.
export function useResumePosition(lang: string, slug: string, percent: number, reduceMotion: boolean) {
  const [saved, setSaved] = useState<number | null>(null);
  const key = resumeKey(lang, slug);

  useEffect(() => {
    try {
      const value = parseResume(localStorage.getItem(key));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only; read once after mount
      if (value !== null) setSaved(value);
    } catch { /* storage unavailable */ }
  }, [key]);

  useEffect(() => {
    try {
      const action = resumeAction(percent);
      if (action === "save") localStorage.setItem(key, String(percent));
      else if (action === "clear") localStorage.removeItem(key);
    } catch { /* storage unavailable */ }
  }, [key, percent]);

  const resume = useCallback(() => {
    if (saved == null) return;
    window.scrollTo({
      top: resumeScrollTop(saved, document.documentElement.scrollHeight, window.innerHeight),
      behavior: reduceMotion ? "auto" : "smooth",
    });
    setSaved(null);
  }, [saved, reduceMotion]);

  return { saved, resume, dismiss: () => setSaved(null) };
}
