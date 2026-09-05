import { useEffect, useState } from "react";
import { useScrollState } from "@/hooks/useScrollState";
import { useClientValue } from "@/hooks/useClientValue";
import { useSettings, useLocale } from "@/stores/settingsStore";
import { buildMeta } from "@/data/buildMeta";

/** Custom event KeyboardShortcuts listens for; lets chrome open the overlay. */
export const SHORTCUTS_EVENT = "po4yka:shortcuts";

// The status line speaks the vim vocabulary literally, so these stay untranslated.
type Mode = "NORMAL" | "INSERT";

function pathLabel(pathname: string): string {
  if (pathname === "/") return "~";
  const trimmed = pathname.replace(/\/$/, "");
  return `~${trimmed}`;
}

/**
 * Vim-style status line pinned to the bottom of the viewport (md+). Reports
 * only real state: editing mode, current path, scroll position, build,
 * theme, locale. Replaces the reading-progress bar, the nav LED meter and
 * the floating scroll-to-top button with one piece of chrome.
 */
export function StatusLine({ pathname: initialPathname = "/" }: { pathname?: string }) {
  const { scrollY, percent } = useScrollState();
  const { theme, resolvedTheme } = useSettings();
  const { locale, t } = useLocale();
  const mounted = useClientValue(() => true, false);
  const [pathname, setPathname] = useState(initialPathname);
  const [mode, setMode] = useState<Mode>("NORMAL");

  useEffect(() => {
    const onSwap = () => setPathname(window.location.pathname);
    document.addEventListener("astro:after-swap", onSwap);
    return () => document.removeEventListener("astro:after-swap", onSwap);
  }, []);

  // INSERT while a text field has focus (footer shell, admin forms), NORMAL otherwise.
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ||
      (el instanceof HTMLElement && el.isContentEditable);
    const onFocusIn = (e: FocusEvent) => { if (isField(e.target)) setMode("INSERT"); };
    const onFocusOut = () => setMode("NORMAL");
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const themeLabel = mounted
    ? theme === "system" ? `${resolvedTheme} (system)` : resolvedTheme
    : "system";
  const localeLabel = mounted ? locale : "en";
  const position = percent <= 0 ? "TOP" : percent >= 100 ? "BOT" : `${percent}%`;

  const buttonClass =
    "px-1.5 -mx-0.5 min-h-[28px] inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer active:opacity-70";

  return (
    <div
      className="no-print hidden md:flex fixed bottom-0 left-0 right-0 z-40 items-center justify-between gap-4 px-6 md:px-10 lg:px-12 font-mono select-none"
      style={{
        height: 28,
        fontSize: 11,
        letterSpacing: "0.06em",
        background: "var(--background)",
        borderTop: "1px solid var(--rule)",
        color: "var(--muted-foreground-dim)",
        fontVariantNumeric: "tabular-nums",
        paddingLeft: "max(1.5rem, env(safe-area-inset-left))",
        paddingRight: "max(1.5rem, env(safe-area-inset-right))",
      }}
    >
      <div className="flex items-center gap-3 min-w-0" aria-hidden="true">
        <span className="text-foreground/80 font-medium shrink-0">-- {mode} --</span>
        <span className="truncate">{pathLabel(pathname)}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span aria-hidden="true">{position}</span>
        <span aria-hidden="true">·</span>
        <span aria-hidden="true">{buildMeta.commitHash}</span>
        <span aria-hidden="true">·</span>
        <span aria-hidden="true">{themeLabel}</span>
        <span aria-hidden="true">·</span>
        <span aria-hidden="true">{localeLabel}</span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          className={buttonClass}
          onClick={() => window.dispatchEvent(new CustomEvent(SHORTCUTS_EVENT))}
          aria-label={t("shortcuts.title")}
        >
          <kbd className="not-italic" style={{ fontSize: 10, padding: "0 0.3em", minWidth: 0 }}>?</kbd>
          <span aria-hidden="true">help</span>
        </button>
        {scrollY > 600 && (
          <>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              className={buttonClass}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label={t("blogPost.scrollToTop")}
            >
              <span aria-hidden="true">gg</span>
              <span aria-hidden="true">top</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
