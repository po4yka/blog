import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useSettingsStore } from "@/stores/settingsStore";

type ThemeMode = "dark" | "light" | "system";
const themeOrder: ThemeMode[] = ["dark", "light", "system"];

const NAV_ROUTES: Record<string, string> = {
  h: "/",
  p: "/projects",
  e: "/experience",
  b: "/blog",
  s: "/settings",
};

const SHORTCUT_GROUPS = [
  {
    label: "Navigation",
    shortcuts: [
      { keys: "g h", desc: "Go to home" },
      { keys: "g p", desc: "Go to projects" },
      { keys: "g e", desc: "Go to experience" },
      { keys: "g b", desc: "Go to blog" },
      { keys: "g s", desc: "Go to settings" },
    ],
  },
  {
    label: "Sections",
    shortcuts: [
      { keys: "j", desc: "Next section" },
      { keys: "k", desc: "Previous section" },
    ],
  },
  {
    label: "Utilities",
    shortcuts: [
      { keys: "t", desc: "Cycle theme" },
      { keys: "/", desc: "Focus terminal" },
      { keys: "?", desc: "Toggle this help" },
      { keys: "Esc", desc: "Close / blur" },
    ],
  },
];

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

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 rounded-[4px] text-xs font-mono text-foreground/70 bg-muted-foreground/10 border border-border min-w-[24px] text-center">
      {children}
    </kbd>
  );
}

export function KeyboardShortcuts() {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [pendingChord, setPendingChord] = useState<string | null>(null);
  const chordTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cycleTheme = useCallback(() => {
    const store = useSettingsStore.getState();
    const idx = themeOrder.indexOf(store.theme);
    store.setTheme(themeOrder[(idx + 1) % themeOrder.length] ?? "dark");
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

      switch (e.key) {
        case "?":
          setOverlayOpen((o) => !o);
          e.preventDefault();
          break;
        case "t":
          cycleTheme();
          e.preventDefault();
          break;
        case "/":
          focusTerminal();
          e.preventDefault();
          break;
        case "j":
          scrollToSection(1);
          e.preventDefault();
          break;
        case "k":
          scrollToSection(-1);
          e.preventDefault();
          break;
        case "g":
          setPendingChord("g");
          chordTimeout.current = setTimeout(() => setPendingChord(null), 1000);
          e.preventDefault();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingChord, overlayOpen, cycleTheme]);

  return (
    <Dialog open={overlayOpen} onOpenChange={setOverlayOpen}>
      <DialogContent
        className="font-mono max-w-md"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-sm text-muted-foreground/60 uppercase tracking-widest font-medium">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-xs text-muted-foreground/40 uppercase tracking-wider mb-2">
                {group.label}
              </div>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground/60">{s.desc}</span>
                    <span className="flex gap-1">
                      {s.keys.split(" ").map((k, i) => (
                        <Kbd key={i}>{k}</Kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-muted-foreground/25 pt-2">
          Press <Kbd>?</Kbd> to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
