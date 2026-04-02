import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Runs a callback on a fixed interval, automatically skipping
 * when the user has enabled reduceMotion. Cleans up on unmount.
 */
export function useAnimationInterval(callback: () => void, intervalMs: number) {
  useEffect(() => {
    const id = setInterval(() => {
      const reduceMotion = useSettingsStore.getState().reduceMotion;
      if (reduceMotion) return;
      callback();
    }, intervalMs);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
