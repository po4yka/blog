import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface ActivityState {
  /** 0-1, how far down the page the user has scrolled */
  scrollProgress: number;
  /** Number of content sections currently in viewport */
  visibleSectionCount: number;
  /** Names of sections currently in viewport */
  visibleSectionNames: string[];
  /** 0-1, smoothed scroll speed */
  scrollVelocity: number;
}

const defaults: ActivityState = {
  scrollProgress: 0,
  visibleSectionCount: 1,
  visibleSectionNames: [],
  scrollVelocity: 0,
};

export const useActivityStore = create<ActivityState>()(
  subscribeWithSelector(() => ({ ...defaults })),
);
