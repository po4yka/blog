/** Run `fn` when the browser is idle (or after a short timeout in older engines).
 *  Use for decorative fetches that must not sit on the LCP critical path. */
export function deferIdle(fn: () => void, { timeout = 1500 }: { timeout?: number } = {}): () => void {
  if (typeof window === "undefined") return () => {};
  type IdleWindow = Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };
  const w = window as IdleWindow;
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(fn, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, timeout);
  return () => window.clearTimeout(id);
}

export function barColor(): string {
  // Neutral grayscale — no chromatic signal colors
  return "var(--muted-foreground)";
}
