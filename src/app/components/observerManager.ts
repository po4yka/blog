/**
 * Shared IntersectionObserver manager.
 * Instead of creating one observer per useInView/useVisible call,
 * all elements at the same threshold+rootMargin share a single observer.
 * Each observer maintains its own element→callback map so the same
 * element can be tracked by multiple observers without conflicts.
 */

type ObserverCallback = (isIntersecting: boolean) => void;

interface ObserverEntry {
  observer: IntersectionObserver;
  callbacks: Map<Element, ObserverCallback>;
}

const pool = new Map<string, ObserverEntry>();

function getKey(threshold: number, rootMargin: string): string {
  return `${threshold}|${rootMargin}`;
}

function getOrCreate(threshold: number, rootMargin: string): ObserverEntry {
  const key = getKey(threshold, rootMargin);
  let entry = pool.get(key);
  if (!entry) {
    const callbacks = new Map<Element, ObserverCallback>();
    const observer = new IntersectionObserver(
      (ioEntries) => {
        for (const ioEntry of ioEntries) {
          const cb = callbacks.get(ioEntry.target);
          if (cb) cb(ioEntry.isIntersecting);
        }
      },
      { threshold, rootMargin }
    );
    entry = { observer, callbacks };
    pool.set(key, entry);
  }
  return entry;
}

export function observe(
  element: Element,
  callback: ObserverCallback,
  threshold = 0.15,
  rootMargin = "0px"
): () => void {
  const entry = getOrCreate(threshold, rootMargin);
  entry.callbacks.set(element, callback);
  entry.observer.observe(element);

  return () => {
    entry.observer.unobserve(element);
    entry.callbacks.delete(element);
  };
}
