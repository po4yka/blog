import { MotionProvider } from "@/components/MotionProvider";
import { NetworkGraph, CpuGraph, ProcessTable } from "./graphs";
import { ReorderableGroup } from "./ReorderableGroup";

export function SystemBottomBar({ delay = 0 }: { delay?: number }) {
  return (
    <MotionProvider>
    <div className="space-y-4">
      <ReorderableGroup
        containerKey="systemBar"
        axis="x"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {{
          "net-bottom": <NetworkGraph delay={delay} />,
          "cpu-history": <CpuGraph delay={delay + 0.05} />,
        }}
      </ReorderableGroup>
      <ProcessTable delay={delay + 0.1} />
    </div>
    </MotionProvider>
  );
}
