import { useSyncExternalStore } from "react";

/**
 * Returns a client-only computed value that is safe for SSR hydration.
 *
 * On the server and during the first client render, returns `serverValue`.
 * After mount, returns the result of `getClientValue()`.
 *
 * Uses a module-level mounted flag so that `useSyncExternalStore`
 * returns the server value during hydration (matching prerendered HTML)
 * and the client value on subsequent renders.
 */

let mounted = false;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  // Schedule mount flag flip after initial hydration render completes
  // Using queueMicrotask ensures it runs after React's hydration commit
  queueMicrotask(() => {
    mounted = true;
    listeners.forEach((cb) => cb());
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useClientValue<T>(getClientValue: () => T, serverValue: T): T {
  return useSyncExternalStore(
    subscribe,
    () => (mounted ? getClientValue() : serverValue),
    () => serverValue,
  );
}
