import { MotionProvider } from "./MotionProvider";
import type { ComponentType } from "react";

export function withMotion<P extends object>(Component: ComponentType<P>) {
  function MotionWrapped(props: P) {
    return (
      <MotionProvider>
        <Component {...props} />
      </MotionProvider>
    );
  }
  MotionWrapped.displayName = `withMotion(${Component.displayName || Component.name || "Component"})`;
  return MotionWrapped;
}
