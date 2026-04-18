import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { t, defaultLocale, type Locale, type TranslationKey } from "@/lib/i18n";

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "default" | "large" | "compact";

export interface SitePreferences {
  theme: ThemeMode;
  reduceMotion: boolean;
  fontSize: FontSize;
  locale: Locale;
}

interface SettingsActions {
  setTheme: (theme: ThemeMode) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setFontSize: (fontSize: FontSize) => void;
  setLocale: (locale: Locale) => void;
  resetPreferences: () => void;
}

type SettingsStore = SitePreferences & SettingsActions;

const defaults: SitePreferences = {
  theme: "light",
  reduceMotion: false,
  fontSize: "default",
  locale: defaultLocale,
};

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyToDOM(prefs: Pick<SitePreferences, "theme" | "reduceMotion" | "fontSize">) {
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
        setLocale: (locale) => set({ locale }),
        resetPreferences: () => set({ ...defaults }),
      }),
      {
        name: "site_preferences",
        partialize: ({ theme, reduceMotion, fontSize, locale }) => ({ theme, reduceMotion, fontSize, locale }),
        migrate: (persisted) => {
          const p = persisted && typeof persisted === "object" ? persisted : {};
          return { ...defaults, ...p };
        },
        version: 2,
      },
    ),
  ),
);

// Apply DOM side-effects on every state change
if (typeof window !== "undefined") {
  // Apply on initial load (wait for persist middleware to rehydrate)
  if (useSettingsStore.persist.hasHydrated()) {
    const { theme, reduceMotion, fontSize } = useSettingsStore.getState();
    applyToDOM({ theme, reduceMotion, fontSize });
  } else {
    useSettingsStore.persist.onFinishHydration((state) => {
      applyToDOM({ theme: state.theme, reduceMotion: state.reduceMotion, fontSize: state.fontSize });
    });
  }

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
  const { theme, reduceMotion, fontSize, locale, setTheme, setReduceMotion, setFontSize, setLocale, resetPreferences } =
    useSettingsStore();

  const resolvedTheme: "light" | "dark" = theme === "system" ? getSystemTheme() : theme;

  return {
    theme,
    reduceMotion,
    fontSize,
    locale,
    resolvedTheme,
    setTheme,
    setReduceMotion,
    setFontSize,
    setLocale,
    resetPreferences,
  };
}

/** Convenience hook for i18n -- returns locale, setter, and a bound t() function */
export function useLocale() {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const tt = (key: TranslationKey) => t(locale, key);
  return { locale, setLocale, t: tt };
}
