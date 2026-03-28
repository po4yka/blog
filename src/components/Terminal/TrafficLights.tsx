import { useState } from "react";

/**
 * macOS traffic-light dots — hover to reveal close / minimize / maximize icons
 */
export function TrafficLights({ dim = false }: { dim?: boolean }) {
  const [hovered, setHovered] = useState(false);

  const dots = [
    { color: "var(--signal-red)", icon: "×" },
    { color: "var(--signal-yellow)", icon: "−" },
    { color: "var(--signal-green)", icon: "＋" },
  ];

  return (
    <div
      className="flex items-center gap-[6px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {dots.map((dot, i) => (
        <span
          key={i}
          className="w-[11px] h-[11px] rounded-full flex items-center justify-center select-none text-2xs font-bold"
          style={{
            backgroundColor: dim && !hovered
              ? "var(--dot-dim)"
              : dot.color,
            opacity: dim && !hovered ? 1 : 0.85,
            transition: "all 0.2s ease",
            cursor: hovered ? "pointer" : "default",
            lineHeight: 1,
            color: hovered ? "rgba(0,0,0,0.6)" : "transparent",
          }}
        >
          {hovered ? dot.icon : ""}
        </span>
      ))}
    </div>
  );
}
