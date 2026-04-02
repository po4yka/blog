import { useInView } from "@/hooks/useInView";
import { Cmd, MacWindow } from "@/components/Terminal";
import { MotionProvider } from "@/components/MotionProvider";

interface ShellProps {
  delay?: number;
  command: React.ReactNode;
  windowTitle: string;
  dimLights?: boolean;
  children: (props: { inView: boolean }) => React.ReactNode;
}

/**
 * Shared scaffolding for MobileTerminal components.
 * Wraps MotionProvider + Cmd + MacWindow + useInView into a single shell
 * so each terminal block only defines its unique content.
 */
export function Shell({
  delay = 0,
  command,
  windowTitle,
  dimLights,
  children,
}: ShellProps) {
  const { ref, inView } = useInView(0.1);

  return (
    <MotionProvider>
      <section className="space-y-4">
        <Cmd delay={delay}>{command}</Cmd>

        <MacWindow title={windowTitle} dimLights={dimLights} delay={delay + 0.05}>
          <div ref={ref}>{children({ inView })}</div>
        </MacWindow>
      </section>
    </MotionProvider>
  );
}
