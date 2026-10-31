import type { Page } from "@playwright/test";

export interface VtAnimation {
  pseudo: string;
  name: string;
  duration: number | string;
  delay: number;
}

interface VtWindow {
  __vt?: VtAnimation[];
  __vtCalls?: number;
}

/**
 * Wraps document.startViewTransition before the page scripts run. Each call is counted in window.__vtCalls, and once the transition is ready its running pseudo-element animations are appended to window.__vt. Where the API is missing nothing is installed.
 */
export async function installVtRecorder(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as VtWindow;
    const original = Document.prototype.startViewTransition;
    if (typeof original !== "function") return;
    w.__vt = [];
    w.__vtCalls = 0;
    document.startViewTransition = function (this: Document, arg?: unknown) {
      w.__vtCalls = (w.__vtCalls ?? 0) + 1;
      const transition = (original as (a?: unknown) => ViewTransition).call(document, arg);
      transition.ready.then(
        () => {
          for (const a of document.getAnimations()) {
            const effect = a.effect as KeyframeEffect | null;
            const pseudo = effect?.pseudoElement;
            if (!effect || !pseudo?.startsWith("::view-transition")) continue;
            const timing = effect.getTiming();
            w.__vt?.push({
              pseudo,
              name: (a as CSSAnimation).animationName ?? "",
              duration: timing.duration ?? 0,
              delay: Number(timing.delay ?? 0),
            });
          }
        },
        () => {},
      );
      return transition;
    } as typeof document.startViewTransition;
  });
}

export const supportsVt = (page: Page): Promise<boolean> =>
  page.evaluate(() => typeof document.startViewTransition === "function");

export const readVt = (page: Page): Promise<VtAnimation[]> =>
  page.evaluate(() => (window as unknown as VtWindow).__vt ?? []);

export const readVtCalls = (page: Page): Promise<number> =>
  page.evaluate(() => (window as unknown as VtWindow).__vtCalls ?? 0);
