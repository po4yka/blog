import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "default" | "large" | "compact";

export interface SitePreferences {
  theme: ThemeMode;
  reduceMotion: boolean;
  fontSize: FontSize;
}

interface SettingsActions {
  setTheme: (theme: ThemeMode) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setFontSize: (fontSize: FontSize) => void;
  resetPreferences: () => void;
}

type SettingsStore = SitePreferences & SettingsActions;

const defaults: SitePreferences = {
  theme: "dark",
  reduceMotion: false,
  fontSize: "default",
};

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyToDOM(prefs: SitePreferences) {
  const root = document.documentElement;

  const resolved = prefs.theme === "system" ? getSystemTheme() : prefs.theme;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");

  root.style.setProperty("--motion-duration-scale", prefs.reduceMotion ? "0" : "1");
  root.classList.toggle("reduce-motion", prefs.reduceMotion);

  const sizes: Record<FontSize, string> = { compact: "15px", default: "16px", large: "17px" };
  root.style.setProperty("--font-size", sizes[prefs.fontSize]);
}

export const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        ...defaults,
        setTheme: (theme) => set({ theme }),
        setReduceMotion: (reduceMotion) => set({ reduceMotion }),
        setFontSize: (fontSize) => set({ fontSize }),
        resetPreferences: () => set({ ...defaults }),
      }),
      {
        name: "site_preferences",
        partialize: ({ theme, reduceMotion, fontSize }) => ({ theme, reduceMotion, fontSize }),
        migrate: (persisted) => {
          // Handle raw JSON from the old useSyncExternalStore format
          // (no wrapper -- just { theme, reduceMotion, fontSize } directly)
          return { ...defaults, ...(persisted as Partial<SitePreferences>) };
        },
        version: 1,
      },
    ),
  ),
);

// Apply DOM side-effects on every state change
if (typeof window !== "undefined") {
  // Apply on initial load
  const { theme, reduceMotion, fontSize } = useSettingsStore.getState();
  applyToDOM({ theme, reduceMotion, fontSize });

  // Subscribe to future changes
  useSettingsStore.subscribe(
    (state) => ({ theme: state.theme, reduceMotion: state.reduceMotion, fontSize: state.fontSize }),
    (prefs) => applyToDOM(prefs),
    { fireImmediately: false },
  );

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const state = useSettingsStore.getState();
    if (state.theme === "system") {
      applyToDOM({ theme: state.theme, reduceMotion: state.reduceMotion, fontSize: state.fontSize });
    }
  });
}

/** Convenience hook preserving the original useSettings() API */
export function useSettings() {
  const { theme, reduceMotion, fontSize, setTheme, setReduceMotion, setFontSize, resetPreferences } =
    useSettingsStore();

  const resolvedTheme: "light" | "dark" = theme === "system" ? getSystemTheme() : theme;

  return {
    theme,
    reduceMotion,
    fontSize,
    resolvedTheme,
    setTheme,
    setReduceMotion,
    setFontSize,
    resetPreferences,
  };
}
