import { MotionConfig } from "motion/react";
import { useSettings } from "@/stores/settingsStore";
import { type ReactNode, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function MotionProvider({ children }: { children: ReactNode }) {
  const { reduceMotion } = useSettings();
  // Avoid hydration mismatch: always render "user" on server,
  // then switch to the persisted value on the client.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const mode = mounted && reduceMotion ? "always" : "user";
  return (
    <MotionConfig reducedMotion={mode}>
      {children}
    </MotionConfig>
  );
}
