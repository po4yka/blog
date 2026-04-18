import { motion } from "motion/react";
import { Zap, ZapOff, RotateCcw, Check, Sun, Moon, Monitor } from "lucide-react";
import { useSettings, useLocale, type FontSize, type ThemeMode } from "@/stores/settingsStore";
import type { TranslationKey } from "@/lib/i18n";
import { useState } from "react";
import { Cmd, Accent, BootBlock, MacWindow } from "./Terminal";
import { SectionHeader } from "./SectionHeader";
import { MotionProvider } from "./MotionProvider";
import { ease } from "@/lib/motion";

const themeOptions: { value: ThemeMode; icon: typeof Sun; labelKey: TranslationKey }[] = [
  { value: "dark", icon: Moon, labelKey: "settings.dark" },
  { value: "light", icon: Sun, labelKey: "settings.light" },
  { value: "system", icon: Monitor, labelKey: "settings.system" },
];

const themeLabelKeys: Record<ThemeMode, TranslationKey> = {
  dark: "settings.dark",
  light: "settings.light",
  system: "settings.system",
};

const fontSizeLabelKeys: Record<FontSize, TranslationKey> = {
  compact: "settings.compact",
  default: "settings.default",
  large: "settings.large",
};

export function Settings() {
  const {
    theme, setTheme,
    reduceMotion, setReduceMotion,
    fontSize, setFontSize,
    resetPreferences,
    resolvedTheme,
  } = useSettings();

  const { locale, setLocale, t: tt } = useLocale();

  const [resetDone, setResetDone] = useState(false);

  const handleReset = () => {
    resetPreferences();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 1500);
  };

  return (
    <MotionProvider>
    <div className="space-y-8 font-mono">
      <SectionHeader
        number="09"
        label="SETTINGS"
        heading={tt("settings.heading") ?? "Preferences"}
        meta={tt("settings.storedLocally") ?? undefined}
      />

      {/* Boot */}
      <BootBlock
        lines={[
          {
            status: "OK",
            text: (
              <>
                Mounted <Accent>po4yka.dev/settings</Accent>
              </>
            ),
          },
          { status: "INFO", text: tt("settings.storedLocally") },
        ]}
      />

      {/* Settings command */}
      <Cmd>
        cat <Accent>/etc/preferences.conf</Accent>
      </Cmd>

      <MacWindow label="preferences.conf" sectionNumber="09" delay={0.05}>
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          {/* Theme */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {resolvedTheme === "dark" ? (
                  <Moon size={14} className="text-muted-foreground" />
                ) : (
                  <Sun size={14} className="text-muted-foreground" />
                )}
                <span className="text-foreground/80 text-mono">
                  {tt("settings.theme")}
                </span>
              </div>
              <span className="text-muted-foreground text-label">
                {theme === "system" ? `${tt("settings.system")} (${resolvedTheme})` : tt(themeLabelKeys[theme])}
              </span>
            </div>
            <p className="text-muted-foreground text-mono-sm">{tt("settings.themeDesc")}</p>
            <div className="flex gap-2">
              {themeOptions.map(({ value, icon: Icon, labelKey }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 transition-all duration-150 cursor-pointer text-label border ${
                    theme === value
                      ? "text-foreground font-medium border-border bg-muted"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                  }`}
                  style={{ borderRadius: "2px" }}
                >
                  <Icon size={11} strokeWidth={2} />
                  {tt(labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Motion */}
          <div className="space-y-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {reduceMotion ? <ZapOff size={14} className="text-muted-foreground" /> : <Zap size={14} className="text-muted-foreground" />}
                <span className="text-foreground/80 text-mono">
                  {tt("settings.motion")}
                </span>
              </div>
              <span className="text-muted-foreground text-label">
                {tt(reduceMotion ? "settings.motionReduced" : "settings.motionFull")}
              </span>
            </div>
            <p className="text-muted-foreground text-mono-sm">{tt("settings.motionDesc")}</p>
            <div className="flex gap-2">
              {[false, true].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setReduceMotion(val)}
                  className={`px-3 py-1.5 transition-all duration-150 cursor-pointer text-label border ${
                    reduceMotion === val
                      ? "text-foreground font-medium border-border bg-muted"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                  }`}
                  style={{ borderRadius: "2px" }}
                >
                  {val ? tt("settings.motionReduced") : tt("settings.motionFull")}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div className="space-y-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <div className="flex items-center justify-between">
              <span className="text-foreground/80 text-mono">
                {tt("settings.fontSize")}
              </span>
              <span className="text-muted-foreground text-label">
                {fontSize}
              </span>
            </div>
            <p className="text-muted-foreground text-mono-sm">{tt("settings.fontSizeDesc")}</p>
            <div className="flex gap-2">
              {(["compact", "default", "large"] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-1.5 transition-all duration-150 cursor-pointer text-label border ${
                    fontSize === size
                      ? "text-foreground font-medium border-border bg-muted"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                  }`}
                  style={{ borderRadius: "2px" }}
                >
                  {tt(fontSizeLabelKeys[size])}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <div className="flex items-center justify-between">
              <span className="text-foreground/80 text-mono">
                {tt("settings.language")}
              </span>
              <span className="text-muted-foreground text-label">
                {locale}
              </span>
            </div>
            <p className="text-muted-foreground text-mono-sm">{tt("settings.languageDesc")}</p>
            <div className="flex gap-2">
              {(["en", "ru"] as const).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={`px-3 py-1.5 transition-all duration-150 cursor-pointer text-label border ${
                    locale === loc
                      ? "text-foreground font-medium border-border bg-muted"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                  }`}
                  style={{ borderRadius: "2px" }}
                >
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline transition-colors duration-150 cursor-pointer text-mono-sm"
            >
              {resetDone ? <Check size={12} /> : <RotateCcw size={12} />}
              {resetDone ? tt("settings.defaultsRestored") : tt("settings.resetDefaults")}
            </button>
          </div>
        </motion.div>
      </MacWindow>
    </div>
    </MotionProvider>
  );
}
