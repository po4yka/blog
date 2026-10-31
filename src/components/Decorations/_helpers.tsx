import { DrawnRule, REVEAL_AFTER_RULE, RevealPanel } from "../Terminal/windows";
import { Reveal } from "@/components/ui/Reveal";

/** Shared panel shell — flat, hairline, operator-console header row. */
export function PanelShell({
  label,
  labelRight,
  children,
  delay = 0,
}: {
  label: React.ReactNode;
  labelRight?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <RevealPanel tone="translucent" className="font-mono" delay={delay}>
      <div className="relative flex items-baseline justify-between px-4 py-2">
        <span className="label-meta">{label}</span>
        {labelRight && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--muted-foreground-dim)",
              letterSpacing: "0.06em",
            }}
          >
            {labelRight}
          </span>
        )}
        <DrawnRule />
      </div>
      <Reveal delay={delay + REVEAL_AFTER_RULE}>{children}</Reveal>
    </RevealPanel>
  );
}
