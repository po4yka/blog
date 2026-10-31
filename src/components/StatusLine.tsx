import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useScrollState } from "@/hooks/useScrollState";
import { useClientValue } from "@/hooks/useClientValue";
import { T } from "./ui/T";
import { useSettings, useLocale } from "@/stores/settingsStore";
import { buildMeta } from "@/data/buildMeta";
import { scrollBehavior } from "@/lib/motion";

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
 * Vim-style status line pinned to the bottom of the viewport. md+: the full bar; below md: a collapsed bar that opens a bottom sheet. Reports
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

  const dialogRef = useRef<HTMLDialogElement>(null);
  const barRef = useRef<HTMLButtonElement>(null);
  // From md up the wrapper is display:none, which would leave an open modal dialog invisible but still inert.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => { if (mq.matches) dialogRef.current?.close(); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  // The TOC bar hides this wrapper by CSS once it hydrates; close an already open modal so a hidden dialog never leaves the page inert.
  useEffect(() => {
    const closeIfToc = () => {
      const dialog = dialogRef.current;
      if (dialog?.open && document.querySelector(".mobile-toc-bar")) dialog.close();
    };
    closeIfToc();
    // documentElement, not body: this bar persists across ClientRouter swaps, which replace <body>.
    const mo = new MutationObserver(closeIfToc);
    mo.observe(document.documentElement, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  const closeSheet = () => dialogRef.current?.close();
  const sheetPad = { paddingLeft: "max(1.5rem, env(safe-area-inset-left))", paddingRight: "max(1.5rem, env(safe-area-inset-right))" };
  const sheetRow = "flex min-h-11 items-center justify-between gap-4 border-b border-rule";
  const sheetButton =
    "flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 border-b border-rule text-left text-foreground active:opacity-70";

  const buttonClass =
    "px-1.5 -mx-0.5 min-h-[28px] inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer active:opacity-70";

  return (
    <>
    <div
      className="no-print hidden md:flex fixed bottom-0 left-0 right-0 z-40 items-center justify-between gap-4 px-(--grid-pad) font-mono select-none"
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
        {/* Fixed slot: TOP / 42% / BOT change width as you scroll, which would shift the bar. */}
        <span aria-hidden="true" className="inline-block text-right" style={{ minWidth: "4ch" }}>
          {position}
        </span>
        <span aria-hidden="true">·</span>
        <span aria-hidden="true">{buildMeta.commitHash}</span>
        <span aria-hidden="true">·</span>
        {/* Fixed slot: "system" on the server becomes "light (system)" after mount (14ch, the longest label). */}
        <span aria-hidden="true" className="inline-block text-right" style={{ minWidth: "14ch" }}>
          {themeLabel}
        </span>
        <span aria-hidden="true">·</span>
        <span aria-hidden="true">{localeLabel}</span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          className={buttonClass}
          onClick={() => window.dispatchEvent(new CustomEvent(SHORTCUTS_EVENT))}
          aria-label={t("shortcuts.title")}
        >
          <kbd className="not-italic" style={{ fontSize: "max(11px, 0.6875rem)", padding: "0 0.3em", minWidth: 0 }}>?</kbd>
          <span aria-hidden="true">help</span>
        </button>
        {/* Always laid out, shown past 600px: appearing would widen the bar and shift it. */}
        {/* visibility: hidden also takes it out of the tab order and the a11y tree. */}
        <span className="contents" style={{ visibility: scrollY > 600 ? "visible" : "hidden" }}>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            className={buttonClass}
            onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })}
            aria-label={t("blogPost.scrollToTop")}
          >
            <span aria-hidden="true">gg</span>
            <span aria-hidden="true">top</span>
          </button>
        </span>
      </div>
    </div>
    {/* Below md: one-line bar that opens a sheet with the same items. Hidden on pages with the
        blog TOC bar, which owns the bottom edge there. Page-end clearance is in site.css. */}
    <div className="status-sheet no-print md:hidden">
      <button
        ref={barRef}
        type="button"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(2.75rem+env(safe-area-inset-bottom))] cursor-pointer items-start justify-between gap-4 border-t border-rule bg-background px-(--grid-pad) text-muted-foreground-dim label-meta select-none active:opacity-70"
        style={{
          fontVariantNumeric: "tabular-nums",
          paddingLeft: "max(1.5rem, env(safe-area-inset-left))",
          paddingRight: "max(1.5rem, env(safe-area-inset-right))",
        }}
      >
        <span className="flex h-11 min-w-0 items-center gap-3">
          <span className="shrink-0 font-medium text-foreground/80">-- {mode} --</span>
          <span className="truncate">{pathLabel(pathname)}</span>
        </span>
        <span className="inline-flex h-11 items-center justify-end" style={{ minWidth: "4ch" }}>{position}</span>
        <span className="sr-only"><T k="statusline.open" /></span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="status-sheet-title"
        onClick={(e) => { if (e.target === dialogRef.current) closeSheet(); }}
        onClose={() => barRef.current?.focus()}
        className="m-0 mt-auto w-full max-w-none max-h-[70vh] overflow-y-auto overscroll-contain rounded-t-[2px] border border-b-0 border-border bg-background p-0 text-foreground backdrop:bg-black/50"
        style={{ boxShadow: "var(--overlay-shadow)" }}
      >
        <div className="flex items-center justify-between border-b border-rule" style={{ paddingLeft: "max(1.5rem, env(safe-area-inset-left))", paddingRight: "env(safe-area-inset-right)" }}>
          <h2 id="status-sheet-title" className="label-meta m-0 text-muted-foreground-dim"><T k="statusline.title" /></h2>
          <button
            type="button"
            onClick={closeSheet}
            aria-label={t("statusline.close")}
            className="flex h-11 w-11 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <dl className="m-0 label-meta" style={sheetPad}>
          <div className={sheetRow}><dt className="text-muted-foreground-dim"><T k="statusline.mode" /></dt><dd className="m-0">{mode}</dd></div>
          <div className={sheetRow}><dt className="text-muted-foreground-dim"><T k="statusline.route" /></dt><dd className="m-0 min-w-0 truncate">{pathLabel(pathname)}</dd></div>
          <div className={sheetRow}><dt className="text-muted-foreground-dim"><T k="settings.theme" /></dt><dd className="m-0">{themeLabel}</dd></div>
          <div className={sheetRow}><dt className="text-muted-foreground-dim"><T k="settings.language" /></dt><dd className="m-0">{localeLabel}</dd></div>
          <div className={sheetRow}><dt className="text-muted-foreground-dim"><T k="statusline.scroll" /></dt><dd className="m-0">{position}</dd></div>
          <div className={sheetRow}><dt className="text-muted-foreground-dim"><T k="statusline.build" /></dt><dd className="m-0">{buildMeta.commitHash}</dd></div>
        </dl>
        <div className="pb-[env(safe-area-inset-bottom)] label-meta" style={sheetPad}>
          <button
            type="button"
            className={sheetButton}
            onClick={() => { closeSheet(); window.dispatchEvent(new CustomEvent(SHORTCUTS_EVENT)); }}
          >
            <span><T k="shortcuts.title" /></span>
            <kbd className="not-italic">?</kbd>
          </button>
          <button
            type="button"
            className={sheetButton}
            onClick={() => { closeSheet(); window.scrollTo({ top: 0, behavior: scrollBehavior() }); }}
          >
            <span><T k="blogPost.scrollToTop" /></span>
            <span aria-hidden="true">gg</span>
          </button>
        </div>
      </dialog>
    </div>
    </>
  );
}
