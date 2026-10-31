import { Reveal } from "./ui/Reveal";
import { Zap, ZapOff, RotateCcw, Sun, Moon, Monitor, Keyboard, Grid3x3, type LucideIcon } from "lucide-react";
import { switchTheme, centerOf } from "@/lib/themeTransition";
import { useSettings, useLocale, type FontSize, type ThemeMode } from "@/stores/settingsStore";
import type { TranslationKey } from "@/lib/i18n";
import { useClientValue } from "@/hooks/useClientValue";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { Cmd, Em, BootBlock, OperatorPanel } from "./Terminal";
import { SectionHeader } from "./SectionHeader";
import { MotionProvider } from "./MotionProvider";
import { T } from "./ui/T";

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

/** One toggle in a settings group: 44px square minimum on phones, opacity press feedback. */
function OptionButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 rounded-[2px] border cursor-pointer text-sm transition-colors duration-150 active:opacity-70 ${
        pressed
          ? "text-foreground font-medium border-border bg-muted"
          : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

/** One setting: icon, label, current value, description, then its toggle group. */
function SettingRow({
  icon: Icon,
  label,
  value,
  description,
  first = false,
  children,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  description: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-3 ${first ? "" : "border-t border-border pt-6"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-muted-foreground" aria-hidden="true" />}
          <span className="text-foreground/80 text-base">{label}</span>
        </div>
        <span className="text-muted-foreground text-sm">{value}</span>
      </div>
      <p className="m-0 text-muted-foreground text-sm">{description}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

export function Settings() {
  const live = useSettings();
  const { setReduceMotion, setFontSize, setKeyboardShortcuts, setGridGuides, resetPreferences } = live;
  const { locale: liveLocale, setLocale, t: tt } = useLocale();

  // Persisted preferences rehydrate before the first client render, and
  // resolvedTheme reads matchMedia, so rendering them straight from the store
  // disagrees with the prerendered HTML (React #418). Show the SSR defaults
  // until mount, then the real values.
  const mounted = useClientValue(() => true, false);
  const theme: ThemeMode = mounted ? live.theme : "system";
  const resolvedTheme = mounted ? live.resolvedTheme : "light";
  const reduceMotion = mounted ? live.reduceMotion : false;
  const fontSize: FontSize = mounted ? live.fontSize : "default";
  const keyboardShortcuts = mounted ? live.keyboardShortcuts : true;
  const gridGuides = mounted ? live.gridGuides : true;
  const locale = mounted ? liveLocale : "en";

  const [resetDone, setResetDone] = useState(false);
  useEffect(() => {
    if (!resetDone) return;
    const id = setTimeout(() => setResetDone(false), 1500);
    return () => clearTimeout(id);
  }, [resetDone]);

  const handleReset = () => {
    resetPreferences();
    setResetDone(true);
  };

  return (
    <MotionProvider>
    <div className="space-y-8">
      <SectionHeader
        level={1}
        number="09"
        label="SETTINGS"
        heading={<T k="settings.heading" />}
        meta={<T k="settings.storedLocally" />}
      />

      {/* Boot */}
      <BootBlock
        lines={[
          {
            status: "OK",
            text: (
              <>
                <T k="terminal.mounted" /> <Em>po4yka.dev/settings</Em>
              </>
            ),
          },
          { status: "INFO", text: <T k="settings.storedLocally" /> },
        ]}
      />

      {/* Settings command */}
      <Cmd>
        cat <Em>/etc/preferences.conf</Em>
      </Cmd>

      <OperatorPanel label="preferences.conf" titleExt="~/settings" delay={0.05}>
        {/* OperatorPanel's body is mono; settings are UI copy, so they are sans (DESIGN.md: mono only for code and terminal output). */}
        <Reveal className="space-y-6 font-sans" speed="slow">
          <SettingRow
            first
            icon={resolvedTheme === "dark" ? Moon : Sun}
            label={tt("settings.theme")}
            value={
              theme === "system"
                ? `${tt("settings.system")} (${tt(resolvedTheme === "dark" ? "settings.dark" : "settings.light")})`
                : tt(themeLabelKeys[theme])
            }
            description={tt("settings.themeDesc")}
          >
            {themeOptions.map(({ value, icon: Icon, labelKey }) => (
              <OptionButton key={value} pressed={theme === value} onClick={(e) => switchTheme(value, centerOf(e.currentTarget))}>
                <Icon size={11} strokeWidth={2} aria-hidden="true" />
                {tt(labelKey)}
              </OptionButton>
            ))}
          </SettingRow>

          <SettingRow
            icon={reduceMotion ? ZapOff : Zap}
            label={tt("settings.motion")}
            value={tt(reduceMotion ? "settings.motionReduced" : "settings.motionFull")}
            description={tt("settings.motionDesc")}
          >
            {[false, true].map((val) => (
              <OptionButton key={String(val)} pressed={reduceMotion === val} onClick={() => setReduceMotion(val)}>
                {tt(val ? "settings.motionReduced" : "settings.motionFull")}
              </OptionButton>
            ))}
          </SettingRow>

          <SettingRow
            icon={Grid3x3}
            label={tt("settings.grid")}
            value={tt(gridGuides ? "settings.gridOn" : "settings.gridOff")}
            description={tt("settings.gridDesc")}
          >
            {[true, false].map((val) => (
              <OptionButton key={String(val)} pressed={gridGuides === val} onClick={() => setGridGuides(val)}>
                {tt(val ? "settings.gridOn" : "settings.gridOff")}
              </OptionButton>
            ))}
          </SettingRow>

          <SettingRow
            label={tt("settings.fontSize")}
            value={tt(fontSizeLabelKeys[fontSize])}
            description={tt("settings.fontSizeDesc")}
          >
            {(["compact", "default", "large"] as FontSize[]).map((size) => (
              <OptionButton key={size} pressed={fontSize === size} onClick={() => setFontSize(size)}>
                {tt(fontSizeLabelKeys[size])}
              </OptionButton>
            ))}
          </SettingRow>

          <SettingRow
            label={tt("settings.language")}
            value={locale.toUpperCase()}
            description={tt("settings.languageDesc")}
          >
            {(["en", "ru"] as const).map((loc) => (
              <OptionButton key={loc} pressed={locale === loc} onClick={() => setLocale(loc)}>
                {loc.toUpperCase()}
              </OptionButton>
            ))}
          </SettingRow>

          <SettingRow
            icon={Keyboard}
            label={tt("settings.shortcuts")}
            value={tt(keyboardShortcuts ? "settings.shortcutsOn" : "settings.shortcutsOff")}
            description={tt("settings.shortcutsDesc")}
          >
            {[true, false].map((val) => (
              <OptionButton key={String(val)} pressed={keyboardShortcuts === val} onClick={() => setKeyboardShortcuts(val)}>
                {tt(val ? "settings.shortcutsOn" : "settings.shortcutsOff")}
              </OptionButton>
            ))}
          </SettingRow>

          {/* Reset: the label stays constant; the result is announced in a status line beside it. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 min-h-11 sm:min-h-0 text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors duration-150 cursor-pointer font-mono text-mono-sm active:opacity-70"
            >
              <RotateCcw size={12} aria-hidden="true" />
              {tt("settings.resetDefaults")}
            </button>
            <span role="status" className="label-meta text-muted-foreground">
              {resetDone ? tt("settings.defaultsRestored") : ""}
            </span>
          </div>
        </Reveal>
      </OperatorPanel>
    </div>
    </MotionProvider>
  );
}
