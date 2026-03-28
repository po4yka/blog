import { useSyncExternalStore, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "default" | "large" | "compact";

export interface SitePreferences {
  theme: ThemeMode;
  reduceMotion: boolean;
  fontSize: FontSize;
}

const STORAGE_KEY = "site_preferences";
const CHANGE_EVENT = "prefs-change";

const defaults: SitePreferences = {
  theme: "dark",
  reduceMotion: false,
  fontSize: "default",
};

function load(): SitePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* SSR or storage unavailable */ }
  return { ...defaults };
}

function save(prefs: SitePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Module-level singleton state
let snapshot: SitePreferences = typeof window !== "undefined" ? load() : { ...defaults };
const listeners = new Set<() => void>();

function emitChange() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SitePreferences {
  return snapshot;
}

function getServerSnapshot(): SitePreferences {
  return defaults;
}

function updatePrefs(updater: (prev: SitePreferences) => SitePreferences) {
  snapshot = updater(snapshot);
  save(snapshot);
  applyToDOM(snapshot);
  emitChange();
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function applyToDOM(prefs: SitePreferences) {
  const root = document.documentElement;

  // Theme
  const resolved = prefs.theme === "system" ? getSystemTheme() : prefs.theme;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");

  // Reduce motion
  root.style.setProperty("--motion-duration-scale", prefs.reduceMotion ? "0" : "1");
  root.classList.toggle("reduce-motion", prefs.reduceMotion);

  // Font size
  const sizes: Record<FontSize, string> = { compact: "15px", default: "16px", large: "17px" };
  root.style.setProperty("--font-size", sizes[prefs.fontSize]);
}

// Listen for changes from other islands on the same page
if (typeof window !== "undefined") {
  window.addEventListener(CHANGE_EVENT, () => {
    snapshot = load();
    emitChange();
  });

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (snapshot.theme === "system") {
      applyToDOM(snapshot);
      emitChange();
    }
  });
}

export function useSettings() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const resolvedTheme: "light" | "dark" =
    prefs.theme === "system" ? getSystemTheme() : prefs.theme;

  const setTheme = useCallback((theme: ThemeMode) => {
    updatePrefs((p) => ({ ...p, theme }));
  }, []);

  const setReduceMotion = useCallback((reduceMotion: boolean) => {
    updatePrefs((p) => ({ ...p, reduceMotion }));
  }, []);

  const setFontSize = useCallback((fontSize: FontSize) => {
    updatePrefs((p) => ({ ...p, fontSize }));
  }, []);

  const resetPreferences = useCallback(() => {
    updatePrefs(() => ({ ...defaults }));
  }, []);

  return {
    ...prefs,
    resolvedTheme,
    setTheme,
    setReduceMotion,
    setFontSize,
    resetPreferences,
  };
}
