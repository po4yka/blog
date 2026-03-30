import { useEffect, useRef } from "react";
import { useSettings } from "@/stores/settingsStore";

export function CursorGlow() {
  const { reduceMotion } = useSettings();
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el || reduceMotion) return;

    function onMove(e: MouseEvent) {
      el!.style.setProperty("--cursor-x", `${e.clientX}px`);
      el!.style.setProperty("--cursor-y", `${e.clientY}px`);
      el!.style.opacity = "1";
    }

    function onLeave() {
      el!.style.opacity = "0";
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <div
      ref={glowRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 40,
        opacity: 0,
        transition: "opacity 0.3s ease",
        background:
          "radial-gradient(300px circle at var(--cursor-x, -999px) var(--cursor-y, -999px), rgba(139, 124, 246, 0.06) 0%, transparent 100%)",
      }}
    />
  );
}
