import { LazyMotion, MotionConfig } from "motion/react";
import { useSettings } from "@/stores/settingsStore";
import { type ReactNode, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// Animation features load as their own chunk, after the island renders: `m.*`
// elements show their initial render until then. Every server-rendered element
// is already in its final state (Phase 2), so nothing waits on this chunk.
const loadFeatures = () => import("@/lib/motionFeatures").then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  const { reduceMotion } = useSettings();
  // Avoid hydration mismatch: always render "user" on server,
  // then switch to the persisted value on the client.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const mode = mounted && reduceMotion ? "always" : "user";
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={mode}>{children}</MotionConfig>
    </LazyMotion>
  );
}
