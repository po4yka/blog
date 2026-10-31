import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { SHORTCUTS_EVENT } from "./StatusLine";
import { useSettingsStore } from "@/stores/settingsStore";
import { switchTheme, centerOf, targetTheme } from "@/lib/themeTransition";
import { PALETTE_EVENT } from "@/lib/palette";
import { scrollBehavior } from "@/lib/motion";

const ShortcutsDialog = lazy(() => import("./KeyboardShortcutsDialog"));
// The palette chunk loads on first open, or on idle after the first interaction.
const loadPalette = () => import("./CommandPalette/CommandPalette");
const CommandPalette = lazy(loadPalette);

type ThemeMode = "dark" | "light" | "system";
const themeOrder: ThemeMode[] = ["dark", "light", "system"];

const NAV_ROUTES: Record<string, string> = {
  h: "/",
  p: "/projects",
  e: "/experience",
  b: "/blog",
  s: "/settings",
};

function isInputTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function getSections(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-section-name]"));
}

function findCurrentSectionIndex(): number {
  const sections = getSections();
  const viewportTop = window.scrollY;
  let closest = 0;
  let closestDist = Infinity;
  for (let i = 0; i < sections.length; i++) {
    const dist = Math.abs((sections[i]?.offsetTop ?? 0) - viewportTop - 80);
    if (dist < closestDist) {
      closestDist = dist;
      closest = i;
    }
  }
  return closest;
}

function scrollToSection(direction: 1 | -1) {
  if (window.location.pathname !== "/") return;
  const sections = getSections();
  if (sections.length === 0) return;
  const current = findCurrentSectionIndex();
  const next = Math.max(0, Math.min(sections.length - 1, current + direction));
  sections[next]?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
}

function focusTerminal() {
  const input = document.getElementById("terminal-input") as HTMLInputElement | null;
  if (input) {
    input.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    setTimeout(() => input.focus(), 400);
  }
}

export function KeyboardShortcuts() {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  const [paletteOpener, setPaletteOpener] = useState<HTMLElement | null>(null);
  const [pendingChord, setPendingChord] = useState<string | null>(null);
  const chordTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  // WCAG 2.1.4: single-key shortcuts must be user-disableable (Settings page).
  const shortcutsEnabled = useSettingsStore((s) => s.keyboardShortcuts);

  const cycleTheme = useCallback(() => {
    const idx = themeOrder.indexOf(targetTheme());
    const toggle = [...document.querySelectorAll("[data-theme-toggle]")].find((el) => el.getClientRects().length > 0);
    switchTheme(themeOrder[(idx + 1) % themeOrder.length] ?? "light", toggle ? centerOf(toggle) : undefined);
  }, []);

  // Prefetch the palette once the visitor interacts, so the first Cmd/Ctrl+K opens without a network wait.
  useEffect(() => {
    const prefetch = () => {
      cleanup();
      if ("requestIdleCallback" in window) window.requestIdleCallback(() => void loadPalette());
      else setTimeout(() => void loadPalette(), 200);
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", prefetch, true);
      window.removeEventListener("keydown", prefetch, true);
    };
    window.addEventListener("pointerdown", prefetch, true);
    window.addEventListener("keydown", prefetch, true);
    return cleanup;
  }, []);

  useEffect(() => {
    const openFrom = (opener: HTMLElement | null) => {
      setPaletteOpener(opener);
      setPaletteLoaded(true);
      setPaletteOpen(true);
    };
    const onPaletteEvent = (e: Event) => openFrom((e as CustomEvent<HTMLElement | null>).detail ?? (document.activeElement as HTMLElement | null));

    function handleKeyDown(e: KeyboardEvent) {
      // Modifier shortcut: not gated by the single-key toggle, and it works inside a text field.
      // e.code, not e.key: the Cyrillic layout reports "л".
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.code === "KeyK") {
        e.preventDefault();
        if (e.repeat || e.isComposing || overlayOpen) return;
        if (paletteOpen) setPaletteOpen(false);
        else openFrom(document.activeElement as HTMLElement | null);
        return;
      }

      // Escape always works
      if (e.key === "Escape") {
        if (overlayOpen) {
          setOverlayOpen(false);
          e.preventDefault();
        } else if (isInputTarget(e.target) && !paletteOpen) {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      // The palette is modal: focus can sit on its panel, so single keys must not fire behind it.
      if (paletteOpen) return;
      // Skip shortcuts when typing in inputs
      if (isInputTarget(e.target)) return;
      // Skip with modifier keys (allow browser shortcuts)
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Respect the Settings toggle for single-key shortcuts
      if (!shortcutsEnabled) return;

      // Chord: g + <key>
      if (pendingChord === "g") {
        clearTimeout(chordTimeout.current);
        setPendingChord(null);
        const route = NAV_ROUTES[e.key];
        if (route) {
          window.location.assign(route);
          e.preventDefault();
        }
        return;
      }

      const keyHandlers: Record<string, () => void> = {
        "?": () => setOverlayOpen((o) => !o),
        "t": () => cycleTheme(),
        "/": () => focusTerminal(),
        "j": () => scrollToSection(1),
        "k": () => scrollToSection(-1),
        "g": () => {
          setPendingChord("g");
          chordTimeout.current = setTimeout(() => setPendingChord(null), 1000);
        },
      };

      const handler = keyHandlers[e.key];
      if (handler) {
        handler();
        e.preventDefault();
      }
    }

    const toggleOverlay = () => setOverlayOpen((o) => !o);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(SHORTCUTS_EVENT, toggleOverlay);
    window.addEventListener(PALETTE_EVENT, onPaletteEvent);
    return () => {
      window.removeEventListener(PALETTE_EVENT, onPaletteEvent);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(SHORTCUTS_EVENT, toggleOverlay);
    };
  }, [pendingChord, overlayOpen, paletteOpen, cycleTheme, shortcutsEnabled]);

  return (
    <Suspense fallback={null}>
      {overlayOpen && <ShortcutsDialog open={overlayOpen} onOpenChange={setOverlayOpen} />}
      {paletteLoaded && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} opener={paletteOpener} />}
    </Suspense>
  );
}
