import { useRef, useCallback, useEffect } from "react";

/**
 * Returns a throttled version of a callback that fires at most once per `delay` ms.
 * Uses requestAnimationFrame for scroll-linked updates when delay is 0.
 *
 * The returned function has a stable identity — it never changes between renders,
 * so it's safe to use directly in addEventListener without extra memoization.
 */
export function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay = 16
): T {
  const lastRun = useRef(0);
  const rafId = useRef<number | null>(null);
  // Store latest callback in a ref so the throttled wrapper never changes identity
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  /* eslint-disable react-hooks/use-memo */
  return useCallback(
    ((...args: unknown[]) => {
      const now = Date.now();
      if (delay === 0) {
        if (rafId.current !== null) return;
        rafId.current = requestAnimationFrame(() => {
          callbackRef.current(...args);
          rafId.current = null;
        });
      } else if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callbackRef.current(...args);
      }
    }) as T,
    [delay]
  );
  /* eslint-enable react-hooks/use-memo */
}
