import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "default" | "large" | "compact";

export interface SitePreferences {
  theme: ThemeMode;
  reduceMotion: boolean;
  fontSize: FontSize;
}

interface SettingsContextType extends SitePreferences {
  setTheme: (theme: ThemeMode) => void;
  setReduceMotion: (reduce: boolean) => void;
  setFontSize: (size: FontSize) => void;
  resetPreferences: () => void;
  resolvedTheme: "light" | "dark";
}

const STORAGE_KEY = "site_preferences";

const defaults: SitePreferences = {
  theme: "dark",
  reduceMotion: false,
  fontSize: "default",
};

function load(): SitePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaults;
}

function save(prefs: SitePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

const SettingsContext = createContext<SettingsContextType | null>(null);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<SitePreferences>(load);

  const resolvedTheme: "light" | "dark" =
    prefs.theme === "system" ? getSystemTheme() : prefs.theme;

  // Apply theme class to <html> — toggle .dark / .light
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (prefs.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setPrefs((p) => ({ ...p })); // force re-render
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [prefs.theme]);

  // Apply reduce-motion
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--motion-duration-scale",
      prefs.reduceMotion ? "0" : "1"
    );
    if (prefs.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [prefs.reduceMotion]);

  // Apply font-size
  useEffect(() => {
    const sizes: Record<FontSize, string> = {
      compact: "15px",
      default: "16px",
      large: "17px",
    };
    document.documentElement.style.setProperty("--font-size", sizes[prefs.fontSize]);
  }, [prefs.fontSize]);

  // Persist
  useEffect(() => {
    save(prefs);
  }, [prefs]);

  const setTheme = useCallback((theme: ThemeMode) => setPrefs((p) => ({ ...p, theme })), []);
  const setReduceMotion = useCallback((reduceMotion: boolean) => setPrefs((p) => ({ ...p, reduceMotion })), []);
  const setFontSize = useCallback((fontSize: FontSize) => setPrefs((p) => ({ ...p, fontSize })), []);
  const resetPreferences = useCallback(() => {
    setPrefs(defaults);
  }, []);

  const contextValue = useMemo(
    () => ({
      ...prefs,
      resolvedTheme,
      setTheme,
      setReduceMotion,
      setFontSize,
      resetPreferences,
    }),
    [prefs, resolvedTheme, setTheme, setReduceMotion, setFontSize, resetPreferences]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
