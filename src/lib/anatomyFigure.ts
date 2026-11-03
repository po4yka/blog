// Client lifecycle for <AnatomyFigure>: live isometric figures built by
// havamal's build_anatomy_figures.py. Each figure ships a plate fragment
// (rendered hidden next to its still SVG) and an ES module that exports
// mount(root, { reducedMotion }) and returns a dispose function.
//
// A figure loads its module when it nears the viewport, follows the site
// theme (the dark/light class on <html>) through data-theme on the fragment,
// remounts when the motion preference changes, and is disposed before a
// ClientRouter swap. Until the module mounts, and whenever it fails, the
// reader sees the still.

export interface LiveModule {
  mount(root: HTMLElement, options: { reducedMotion: boolean }): () => void;
}

export type ModuleLoader = (url: string) => Promise<LiveModule>;

/** Calls `onVisible` once when `el` nears the viewport; returns a disconnect. */
export type VisibilityWatcher = (el: Element, onVisible: () => void) => () => void;

export const FIGURE_SELECTOR = ".anatomy-figure[data-anatomy-src]";
export const LIVE_SELECTOR = ".anatomy-live";

export function siteTheme(html: HTMLElement): "dark" | "light" {
  return html.classList.contains("dark") ? "dark" : "light";
}

/** ThemeScript sets data-motion="reduce" from the OS setting or the reader's Settings. */
export function prefersReducedMotion(html: HTMLElement): boolean {
  return html.dataset.motion === "reduce";
}

const loadModule: ModuleLoader = (url) => import(/* @vite-ignore */ url) as Promise<LiveModule>;

const watchVisibility: VisibilityWatcher = (el, onVisible) => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        onVisible();
      }
    },
    { rootMargin: "200px 0px" },
  );
  observer.observe(el);
  return () => observer.disconnect();
};

interface FigureState {
  figure: HTMLElement;
  live: HTMLElement;
  src: string;
  module: LiveModule | null;
  dispose: (() => void) | null;
  stopWatching: () => void;
}

/**
 * Sets up every live figure in `doc` and returns a teardown that disposes
 * them. Call it on astro:page-load and call the teardown on astro:before-swap.
 */
export function setupAnatomyFigures(
  doc: Document,
  { load = loadModule, watch = watchVisibility }: { load?: ModuleLoader; watch?: VisibilityWatcher } = {},
): () => void {
  const html = doc.documentElement;
  const states: FigureState[] = [];
  let tornDown = false;

  const applyTheme = () => {
    const theme = siteTheme(html);
    for (const state of states) state.live.setAttribute("data-theme", theme);
  };

  const mount = (state: FigureState) => {
    if (!state.module || tornDown) return;
    state.dispose?.();
    state.dispose = null;
    try {
      state.dispose = state.module.mount(state.live, { reducedMotion: prefersReducedMotion(html) });
      state.figure.setAttribute("data-live-ready", "");
    } catch (error) {
      showStill(state);
      console.warn(`anatomy figure ${state.src} failed to mount`, error);
    }
  };

  // src/styles/anatomy.css shows the plate only on a figure with data-live-ready.
  const showStill = (state: FigureState) => {
    state.figure.removeAttribute("data-live-ready");
  };

  for (const figure of Array.from(doc.querySelectorAll<HTMLElement>(FIGURE_SELECTOR))) {
    const live = figure.querySelector<HTMLElement>(LIVE_SELECTOR);
    const src = figure.dataset.anatomySrc;
    if (!live || !src) continue;
    const state: FigureState = { figure, live, src, module: null, dispose: null, stopWatching: () => {} };
    states.push(state);
    state.stopWatching = watch(figure, () => {
      load(src)
        .then((module) => {
          state.module = module;
          mount(state);
        })
        .catch((error) => {
          showStill(state);
          console.warn(`anatomy figure ${src} failed to load`, error);
        });
    });
  }
  applyTheme();

  let motion = prefersReducedMotion(html);
  const observer = new MutationObserver(() => {
    applyTheme();
    const next = prefersReducedMotion(html);
    if (next === motion) return;
    motion = next;
    for (const state of states) mount(state);
  });
  observer.observe(html, { attributes: true, attributeFilter: ["class", "data-motion"] });

  return () => {
    tornDown = true;
    observer.disconnect();
    for (const state of states) {
      state.stopWatching();
      state.dispose?.();
      state.dispose = null;
    }
  };
}
