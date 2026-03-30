import { MotionProvider } from "@/components/MotionProvider";
import { MemoryPanel, DiskBars } from "./panels";
import { ReorderableGroup } from "./ReorderableGroup";

export function MemoryGrid({ delay = 0 }: { delay?: number }) {
  return (
    <MotionProvider>
      <ReorderableGroup
        containerKey="memoryGrid"
        axis="x"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {{
          memory: <MemoryPanel delay={delay} />,
          disks: <DiskBars delay={delay + 0.05} />,
        }}
      </ReorderableGroup>
    </MotionProvider>
  );
}
