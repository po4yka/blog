import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ContainerKey = "heroSidebar" | "memoryGrid" | "systemBar";

const defaults: Record<ContainerKey, string[]> = {
  heroSidebar: ["cpu", "net"],
  memoryGrid: ["memory", "disks"],
  systemBar: ["net-bottom", "cpu-history"],
};

interface PanelOrderState {
  heroSidebar: string[];
  memoryGrid: string[];
  systemBar: string[];
  setOrder: (key: ContainerKey, order: string[]) => void;
  resetOrder: (key?: ContainerKey) => void;
}

/** Validate persisted order against expected IDs, fall back to defaults if stale */
function validateOrder(persisted: string[], expected: string[]): string[] {
  if (
    persisted.length !== expected.length ||
    !expected.every((id) => persisted.includes(id))
  ) {
    return expected;
  }
  return persisted;
}

export const usePanelOrderStore = create<PanelOrderState>()(
  persist(
    (set) => ({
      ...defaults,
      setOrder: (key, order) => set({ [key]: order }),
      resetOrder: (key) => {
        if (key) {
          set({ [key]: defaults[key] });
        } else {
          set({ ...defaults });
        }
      },
    }),
    {
      name: "panel_order",
      version: 1,
      partialize: ({ heroSidebar, memoryGrid, systemBar }) => ({
        heroSidebar,
        memoryGrid,
        systemBar,
      }),
      migrate: (persisted) => {
        const state =
          persisted && typeof persisted === "object"
            ? (persisted as Partial<Record<ContainerKey, string[]>>)
            : {};
        return {
          heroSidebar: validateOrder(state.heroSidebar ?? [], defaults.heroSidebar),
          memoryGrid: validateOrder(state.memoryGrid ?? [], defaults.memoryGrid),
          systemBar: validateOrder(state.systemBar ?? [], defaults.systemBar),
        };
      },
    },
  ),
);
