import { useInView } from "@/hooks/useInView";
import { Cmd, OperatorPanel } from "@/components/Terminal";
import { MotionProvider } from "@/components/MotionProvider";

interface ShellProps {
  delay?: number;
  command: React.ReactNode;
  windowTitle: string;
  children: (props: { inView: boolean }) => React.ReactNode;
}

/**
 * Shared scaffolding for MobileTerminal components.
 * Wraps MotionProvider + Cmd + OperatorPanel + useInView into a single shell
 * so each terminal block only defines its unique content.
 */
export function Shell({
  delay = 0,
  command,
  windowTitle,
  children,
}: ShellProps) {
  const { ref, inView } = useInView(0.1);

  return (
    <MotionProvider>
      <section className="space-y-4">
        <Cmd delay={delay}>{command}</Cmd>

        <OperatorPanel label={windowTitle} delay={delay + 0.05}>
          <div ref={ref}>{children({ inView })}</div>
        </OperatorPanel>
      </section>
    </MotionProvider>
  );
}
