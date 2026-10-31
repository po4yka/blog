import { useSettingsStore, type ThemeMode } from "@/stores/settingsStore";

export interface WipeOrigin {
  x: number;
  y: number;
}

/** Radius of the smallest circle centred on the origin that covers the viewport. */
export function wipeRadius(origin: WipeOrigin, width: number, height: number): number {
  return Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y));
}

export function resolveTheme(mode: ThemeMode, systemDark: boolean): "light" | "dark" {
  return mode === "system" ? (systemDark ? "dark" : "light") : mode;
}

/** Wipe only when motion and effects are allowed, the API exists, and the visible theme really changes. Effects "reduced" and "off" get the plain fade, like reduced motion. */
export function shouldWipe(input: {
  reduceMotion: boolean;
  osReduceMotion: boolean;
  reducedEffects: boolean;
  supported: boolean;
  from: "light" | "dark";
  to: "light" | "dark";
  running: boolean;
}): boolean {
  return !input.reduceMotion && !input.osReduceMotion && !input.reducedEffects && input.supported && !input.running && input.from !== input.to;
}

let running = false;
// The theme a running wipe is heading to. The store changes only in the transition callback (a frame later),
// so a second gesture in that frame must start from this target, not from the store.
let pendingTheme: ThemeMode | null = null;

/** The theme the visitor will see next: the target of a running wipe, else the stored theme. */
export function targetTheme(): ThemeMode {
  return pendingTheme ?? useSettingsStore.getState().theme;
}

/** Centre of an element, used as the wipe origin. */
export function centerOf(el: Element): WipeOrigin {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Change the theme for a visitor gesture. Wipes a circle out from `origin` (default: viewport centre) when allowed, otherwise sets the theme directly. A second call while a wipe runs sets the theme directly.
 * The store applies the DOM change synchronously inside `setTheme`, so it is safe in the view-transition callback.
 */
export function switchTheme(next: ThemeMode, origin?: WipeOrigin): void {
  const { theme, reduceMotion, setTheme } = useSettingsStore.getState();
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const supported = typeof document.startViewTransition === "function";
  const wipe = shouldWipe({
    reduceMotion,
    osReduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    reducedEffects: (document.documentElement.dataset.effects ?? "full") !== "full",
    supported,
    from: resolveTheme(pendingTheme ?? theme, systemDark),
    to: resolveTheme(next, systemDark),
    running,
  });
  if (!wipe) {
    // During a wipe, the pending callback must also land on this newer theme.
    if (running) pendingTheme = next;
    setTheme(next);
    return;
  }

  const { x, y } = origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const root = document.documentElement;
  root.style.setProperty("--wipe-x", `${x}px`);
  root.style.setProperty("--wipe-y", `${y}px`);
  root.style.setProperty("--wipe-r", `${wipeRadius({ x, y }, window.innerWidth, window.innerHeight)}px`);
  root.setAttribute("data-theme-wipe", "");
  running = true;
  pendingTheme = next;

  const done = () => {
    document.removeEventListener("astro:before-preparation", skip);
    running = false;
    pendingTheme = null;
    root.removeAttribute("data-theme-wipe");
    root.style.removeProperty("--wipe-x");
    root.style.removeProperty("--wipe-y");
    root.style.removeProperty("--wipe-r");
  };
  const transition = document.startViewTransition(() => setTheme(pendingTheme ?? next));
  // A router navigation must not start while the wipe attribute is set, so end the wipe first.
  const skip = () => transition.skipTransition();
  document.addEventListener("astro:before-preparation", skip, { once: true });
  // A skipped transition rejects `ready`; `finished` still resolves and runs the cleanup.
  transition.ready.catch(() => {});
  transition.finished.then(done, done);
}
