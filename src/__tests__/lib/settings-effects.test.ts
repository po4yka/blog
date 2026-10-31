import { afterEach, describe, expect, it, vi } from "vitest";
import { applyToDOM, migratePreferences, useSettingsStore } from "@/stores/settingsStore";

describe("effects preference", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("defaults to full", () => {
    expect(useSettingsStore.getState().effects).toBe("full");
  });

  it("migrates version 3 state keeping every stored field and adding effects: full", () => {
    const v3 = { theme: "dark", reduceMotion: true, fontSize: "large", locale: "ru", keyboardShortcuts: false, gridGuides: false };
    expect(migratePreferences(v3)).toEqual({ ...v3, effects: "full" });
  });

  it("keeps a valid stored effects value and repairs an invalid one", () => {
    expect(migratePreferences({ effects: "off" }).effects).toBe("off");
    expect(migratePreferences({ effects: "ultra" }).effects).toBe("full");
    expect(migratePreferences(null).effects).toBe("full");
  });

  it("applyToDOM sets data-effects for reduced and off and clears it for full", () => {
    const dataset: Record<string, string | undefined> = {};
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("document", {
      documentElement: {
        dataset,
        classList: { toggle: () => false },
        style: { setProperty: () => {} },
        setAttribute: () => {},
        removeAttribute: () => {},
      },
      querySelector: () => null,
      createElement: () => ({ setAttribute: () => {} }),
      head: { appendChild: () => {} },
    });
    const base = { theme: "light", reduceMotion: false, fontSize: "default", gridGuides: true } as const;
    applyToDOM({ ...base, effects: "reduced" });
    expect(dataset.effects).toBe("reduced");
    applyToDOM({ ...base, effects: "off" });
    expect(dataset.effects).toBe("off");
    applyToDOM({ ...base, effects: "full" });
    expect(dataset.effects).toBeUndefined();
  });
});
