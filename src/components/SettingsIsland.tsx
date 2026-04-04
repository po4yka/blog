import { motion } from "motion/react";
import { Zap, ZapOff, RotateCcw, Check, Sun, Moon, Monitor } from "lucide-react";
import { useSettings, useLocale, type FontSize, type ThemeMode } from "@/stores/settingsStore";
import type { TranslationKey } from "@/lib/i18n";
import { useState } from "react";
import { Cmd, Accent, BootBlock, MacWindow } from "./Terminal";
import { MotionProvider } from "./MotionProvider";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

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

      <MacWindow title="preferences.conf" dimLights delay={0.05}>
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
                  <Moon size={14} className="text-accent/60" />
                ) : (
                  <Sun size={14} className="text-accent/60" />
                )}
                <span className="text-foreground/70 text-mono">
                  {tt("settings.theme")}
                </span>
              </div>
              <span className="text-muted-foreground/55 text-label">
                {theme === "system" ? `${tt("settings.system")} (${resolvedTheme})` : tt(themeLabelKeys[theme])}
              </span>
            </div>
            <div className="flex gap-2">
              {themeOptions.map(({ value, icon: Icon, labelKey }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 transition-all duration-200 cursor-pointer text-label rounded-[5px] ${
                    theme === value
                      ? "text-accent bg-accent/10"
                      : "text-muted-foreground/55 hover:text-foreground/60 bg-muted-foreground/5"
                  }`}
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
                {reduceMotion ? <ZapOff size={14} className="text-muted-foreground/55" /> : <Zap size={14} className="text-accent/60" />}
                <span className="text-foreground/70 text-mono">
                  {tt("settings.motion")}
                </span>
              </div>
              <span className="text-muted-foreground/55 text-label">
                {tt(reduceMotion ? "settings.motionReduced" : "settings.motionFull")}
              </span>
            </div>
            <div className="flex gap-2">
              {[false, true].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setReduceMotion(val)}
                  className={`px-3 py-1.5 transition-all duration-200 cursor-pointer text-label rounded-[5px] ${
                    reduceMotion === val
                      ? "text-accent bg-accent/10"
                      : "text-muted-foreground/55 hover:text-foreground/60 bg-muted-foreground/5"
                  }`}
                >
                  {val ? tt("settings.motionReduced") : tt("settings.motionFull")}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div className="space-y-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <div className="flex items-center justify-between">
              <span className="text-foreground/70 text-mono">
                {tt("settings.fontSize")}
              </span>
              <span className="text-muted-foreground/55 text-label">
                {fontSize}
              </span>
            </div>
            <div className="flex gap-2">
              {(["compact", "default", "large"] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-1.5 transition-all duration-200 cursor-pointer text-label rounded-[5px] ${
                    fontSize === size
                      ? "text-accent bg-accent/10"
                      : "text-muted-foreground/55 hover:text-foreground/60 bg-muted-foreground/5"
                  }`}
                >
                  {tt(fontSizeLabelKeys[size])}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-3" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <div className="flex items-center justify-between">
              <span className="text-foreground/70 text-mono">
                {tt("settings.language")}
              </span>
              <span className="text-muted-foreground/55 text-label">
                {locale}
              </span>
            </div>
            <div className="flex gap-2">
              {(["en", "ru"] as const).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={`px-3 py-1.5 transition-all duration-200 cursor-pointer text-label rounded-[5px] ${
                    locale === loc
                      ? "text-accent bg-accent/10"
                      : "text-muted-foreground/55 hover:text-foreground/60 bg-muted-foreground/5"
                  }`}
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
              className="inline-flex items-center gap-2 text-muted-foreground/55 hover:text-accent transition-colors duration-200 cursor-pointer text-mono-sm"
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
