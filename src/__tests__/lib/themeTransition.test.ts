import { afterEach, describe, expect, it, vi } from "vitest";
import { postTitleTransitionName } from "@/lib/blog/format";
import { resolveTheme, shouldWipe, switchTheme, wipeRadius } from "@/lib/themeTransition";

const state = vi.hoisted(() => ({ theme: "light", reduceMotion: false, setTheme: vi.fn() }));
vi.mock("@/stores/settingsStore", () => ({ useSettingsStore: { getState: () => state } }));

describe("switchTheme", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("wipes once, sets a second change directly, and cleans up when finished", async () => {
    let finish: () => void = () => {};
    const finished = new Promise<void>((resolve) => (finish = resolve));
    const attrs = new Set<string>();
    const startViewTransition = vi.fn((cb: () => void) => {
      cb();
      return { ready: Promise.resolve(), finished, skipTransition: vi.fn() };
    });
    vi.stubGlobal("window", { innerWidth: 300, innerHeight: 400, matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("document", {
      startViewTransition,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      documentElement: {
        style: { setProperty: vi.fn(), removeProperty: vi.fn() },
        setAttribute: (k: string) => attrs.add(k),
        removeAttribute: (k: string) => attrs.delete(k),
      },
    });

    switchTheme("dark");
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(attrs.has("data-theme-wipe")).toBe(true);

    switchTheme("dark");
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(state.setTheme).toHaveBeenCalledTimes(2);

    finish();
    await finished;
    await Promise.resolve();
    expect(attrs.has("data-theme-wipe")).toBe(false);

    switchTheme("dark");
    expect(startViewTransition).toHaveBeenCalledTimes(2);
  });
});

describe("wipeRadius", () => {
  it("reaches the farthest corner", () => {
    expect(wipeRadius({ x: 0, y: 0 }, 300, 400)).toBe(500);
    expect(wipeRadius({ x: 300, y: 400 }, 300, 400)).toBe(500);
    expect(wipeRadius({ x: 150, y: 200 }, 300, 400)).toBe(250);
  });

  it("covers the viewport for an origin outside it", () => {
    expect(wipeRadius({ x: -30, y: 0 }, 300, 400)).toBeCloseTo(Math.hypot(330, 400));
  });
});

describe("resolveTheme", () => {
  it("resolves system through the OS scheme", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("shouldWipe", () => {
  const base = { reduceMotion: false, osReduceMotion: false, supported: true, from: "light", to: "dark", running: false } as const;

  it("wipes when motion is allowed and the theme changes", () => {
    expect(shouldWipe(base)).toBe(true);
  });

  it.each([
    ["stored reduce flag", { reduceMotion: true }],
    ["OS reduce flag", { osReduceMotion: true }],
    ["no View Transitions API", { supported: false }],
    ["same resolved theme", { to: "light" }],
    ["a wipe already running", { running: true }],
  ] as const)("does not wipe with %s", (_label, override) => {
    expect(shouldWipe({ ...base, ...override })).toBe(false);
  });
});

describe("postTitleTransitionName", () => {
  it("prefixes a kebab-case slug unchanged", () => {
    expect(postTitleTransitionName("2026-intro")).toBe("post-title-2026-intro");
  });

  it("escapes every other character as _<hex>_, so the result is a valid custom-ident", () => {
    expect(postTitleTransitionName("a.b c")).toBe("post-title-a_2e_b_20_c");
    expect(postTitleTransitionName("ё")).toBe("post-title-_451_");
    expect(postTitleTransitionName("my_post")).toBe("post-title-my_5f_post");
    for (const slug of ["a.b c", "привет", "x_y"]) expect(postTitleTransitionName(slug)).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  it("never maps two different slugs to one name", () => {
    const slugs = ["a.b", "a-b", "a_b", "a_2e_b", "привет", "приветы", "one", "two"];
    const names = slugs.map(postTitleTransitionName);
    expect(new Set(names).size).toBe(slugs.length);
  });
});
