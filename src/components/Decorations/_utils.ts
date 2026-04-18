/** Run `fn` after the page has finished loading and the browser is idle.
 *  Waits for `window.load` first so decorative fetches never land on the
 *  critical request chain (Lighthouse flags any request initiated before
 *  network-idle as critical, even with plain `requestIdleCallback`). */
export function deferIdle(fn: () => void, { timeout = 2000 }: { timeout?: number } = {}): () => void {
  if (typeof window === "undefined") return () => {};
  type IdleWindow = Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };
  const w = window as IdleWindow;

  let cancelled = false;
  let idleId: number | undefined;
  let timeoutId: number | undefined;

  const schedule = () => {
    if (cancelled) return;
    if (w.requestIdleCallback) {
      idleId = w.requestIdleCallback(() => {
        if (!cancelled) fn();
      }, { timeout });
    } else {
      timeoutId = window.setTimeout(() => {
        if (!cancelled) fn();
      }, timeout);
    }
  };

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  };
}

export function barColor(): string {
  // Neutral grayscale — no chromatic signal colors
  return "var(--muted-foreground)";
}
