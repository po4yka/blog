import { MotionConfig } from "motion/react";
import { useSettings } from "@/stores/settingsStore";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  const { reduceMotion } = useSettings();
  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
