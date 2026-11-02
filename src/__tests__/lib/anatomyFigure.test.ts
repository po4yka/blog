import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FIGURE_SELECTOR,
  LIVE_SELECTOR,
  prefersReducedMotion,
  setupAnatomyFigures,
  siteTheme,
  type LiveModule,
} from "@/lib/anatomyFigure";

// The vitest environment is node, so these fakes model just the DOM surface
// that src/lib/anatomyFigure.ts touches.
class FakeElement {
  attributes = new Map<string, string>();
  dataset: Record<string, string> = {};
  classes = new Set<string>();
  children: FakeElement[] = [];
  classList = {
    contains: (name: string) => this.classes.has(name),
  };
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
  hasAttribute(name: string) {
    return this.attributes.has(name);
  }
  // Only the one selector the module uses; anything else is a test bug.
  querySelector(selector: string) {
    expect(selector).toBe(LIVE_SELECTOR);
    return this.children.find((child) => child.classes.has("anatomy-live")) ?? null;
  }
}

let mutationCallbacks: Array<() => void> = [];
class FakeMutationObserver {
  constructor(private callback: () => void) {}
  observe() {
    mutationCallbacks.push(this.callback);
  }
  disconnect() {
    mutationCallbacks = mutationCallbacks.filter((cb) => cb !== this.callback);
  }
}

function liveElement(): FakeElement {
  const live = new FakeElement();
  live.classes.add("anatomy-live");
  return live;
}

function page(figureCount: number, { theme = "light", motion }: { theme?: string; motion?: string } = {}) {
  const html = new FakeElement();
  html.classes.add(theme);
  if (motion) html.dataset.motion = motion;
  const figures = Array.from({ length: figureCount }, (_, i) => {
    const figure = new FakeElement();
    figure.dataset.anatomySrc = `/_astro/figure-${i}.js`;
    figure.children.push(liveElement());
    return figure;
  });
  const doc = {
    documentElement: html,
    querySelectorAll: (selector: string) => {
      expect(selector).toBe(FIGURE_SELECTOR);
      return figures;
    },
  } as unknown as Document;
  return { doc, html, figures, live: (i: number) => figures[i]!.children[0]! };
}

function moduleSpy() {
  const dispose = vi.fn();
  const mount = vi.fn(() => dispose);
  return { module: { mount } as unknown as LiveModule, mount, dispose };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  mutationCallbacks = [];
  vi.stubGlobal("MutationObserver", FakeMutationObserver);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("siteTheme and prefersReducedMotion", () => {
  it("read the html class and data-motion", () => {
    const { html } = page(0, { theme: "dark", motion: "reduce" });
    expect(siteTheme(html as unknown as HTMLElement)).toBe("dark");
    expect(prefersReducedMotion(html as unknown as HTMLElement)).toBe(true);
    const plain = page(0).html;
    expect(siteTheme(plain as unknown as HTMLElement)).toBe("light");
    expect(prefersReducedMotion(plain as unknown as HTMLElement)).toBe(false);
  });
});

describe("setupAnatomyFigures", () => {
  it("themes every fragment at once but loads a module only when its figure is visible", async () => {
    const { doc, figures, live } = page(2, { theme: "dark" });
    const visible: Array<() => void> = [];
    const { module, mount } = moduleSpy();
    const load = vi.fn(async () => module);

    setupAnatomyFigures(doc, { load, watch: (_el, onVisible) => (visible.push(onVisible), () => {}) });

    expect(live(0).attributes.get("data-theme")).toBe("dark");
    expect(live(1).attributes.get("data-theme")).toBe("dark");
    expect(load).not.toHaveBeenCalled();
    visible[1]!();
    await flush();
    expect(load).toHaveBeenCalledWith("/_astro/figure-1.js");
    expect(mount).toHaveBeenCalledWith(live(1), { reducedMotion: false });
    expect(figures[1]!.hasAttribute("data-live-ready")).toBe(true);
    expect(figures[0]!.hasAttribute("data-live-ready")).toBe(false);
  });

  it("follows a theme change and remounts on a motion change", async () => {
    const { doc, html, live } = page(1);
    const { module, mount, dispose } = moduleSpy();
    setupAnatomyFigures(doc, { load: async () => module, watch: (_el, onVisible) => (onVisible(), () => {}) });
    await flush();

    html.classes.clear();
    html.classes.add("dark");
    mutationCallbacks.forEach((cb) => cb());
    expect(live(0).attributes.get("data-theme")).toBe("dark");
    expect(mount).toHaveBeenCalledTimes(1);

    html.dataset.motion = "reduce";
    mutationCallbacks.forEach((cb) => cb());
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(mount).toHaveBeenLastCalledWith(live(0), { reducedMotion: true });
  });

  it("keeps the still when the module fails to load or to mount", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { doc, figures } = page(2);
    const broken = { mount: () => { throw new Error("broken"); } } as unknown as LiveModule;
    const load = vi.fn(async (url: string) => {
      if (url.endsWith("0.js")) throw new Error("404");
      return broken;
    });

    setupAnatomyFigures(doc, { load, watch: (_el, onVisible) => (onVisible(), () => {}) });
    await flush();

    expect(figures[0]!.hasAttribute("data-live-ready")).toBe(false);
    expect(figures[1]!.hasAttribute("data-live-ready")).toBe(false);
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it("skips a figure without a module URL or a plate", () => {
    const { doc, figures } = page(2);
    delete figures[0]!.dataset.anatomySrc;
    figures[1]!.children = [];
    const watch = vi.fn(() => () => {});

    setupAnatomyFigures(doc, { load: vi.fn(), watch });

    expect(watch).not.toHaveBeenCalled();
  });

  it("returns to the still when a remount throws after a good mount", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { doc, html, figures } = page(1);
    let calls = 0;
    const flaky = {
      mount: () => {
        calls += 1;
        if (calls > 1) throw new Error("remount failed");
        return () => {};
      },
    } as unknown as LiveModule;
    setupAnatomyFigures(doc, { load: async () => flaky, watch: (_el, onVisible) => (onVisible(), () => {}) });
    await flush();
    expect(figures[0]!.hasAttribute("data-live-ready")).toBe(true);

    html.dataset.motion = "reduce";
    mutationCallbacks.forEach((cb) => cb());

    expect(figures[0]!.hasAttribute("data-live-ready")).toBe(false);
  });

  it("teardown disposes mounted figures, stops watching, and ignores a late load", async () => {
    const { doc } = page(2);
    const { module, mount, dispose } = moduleSpy();
    const stops = [vi.fn(), vi.fn()];
    const visible: Array<() => void> = [];
    let resolveLate: (m: LiveModule) => void = () => {};
    const load = vi.fn((url: string) =>
      url.endsWith("0.js") ? Promise.resolve(module) : new Promise<LiveModule>((resolve) => (resolveLate = resolve)),
    );
    const teardown = setupAnatomyFigures(doc, {
      load,
      watch: (_el, onVisible) => (visible.push(onVisible), stops[visible.length - 1]!),
    });
    visible.forEach((show) => show());
    await flush();

    teardown();
    resolveLate(module);
    await flush();

    expect(dispose).toHaveBeenCalledTimes(1);
    expect(mount).toHaveBeenCalledTimes(1);
    expect(stops[0]).toHaveBeenCalled();
    expect(stops[1]).toHaveBeenCalled();
    expect(mutationCallbacks).toEqual([]);
  });
});
