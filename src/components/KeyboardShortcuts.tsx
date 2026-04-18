import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

const ShortcutsDialog = lazy(() => import("./KeyboardShortcutsDialog"));

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
  sections[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusTerminal() {
  const input = document.getElementById("terminal-input") as HTMLInputElement | null;
  if (input) {
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => input.focus(), 400);
  }
}

export function KeyboardShortcuts() {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [pendingChord, setPendingChord] = useState<string | null>(null);
  const chordTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cycleTheme = useCallback(() => {
    const store = useSettingsStore.getState();
    const idx = themeOrder.indexOf(store.theme);
    store.setTheme(themeOrder[(idx + 1) % themeOrder.length] ?? "light");
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Escape always works
      if (e.key === "Escape") {
        if (overlayOpen) {
          setOverlayOpen(false);
          e.preventDefault();
        } else if (isInputTarget(e.target)) {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      // Skip shortcuts when typing in inputs
      if (isInputTarget(e.target)) return;
      // Skip with modifier keys (allow browser shortcuts)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingChord, overlayOpen, cycleTheme]);

  if (!overlayOpen) return null;

  return (
    <Suspense fallback={null}>
      <ShortcutsDialog open={overlayOpen} onOpenChange={setOverlayOpen} />
    </Suspense>
  );
}
