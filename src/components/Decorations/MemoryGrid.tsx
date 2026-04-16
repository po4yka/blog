import { MotionProvider } from "@/components/MotionProvider";
import { MemoryPanel } from "./panels";

export function MemoryGrid({ delay = 0 }: { delay?: number }) {
  return (
    <MotionProvider>
      <MemoryPanel delay={delay} />
    </MotionProvider>
  );
}
