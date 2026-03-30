import { Reorder, useDragControls } from "motion/react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePanelOrderStore, type ContainerKey } from "@/stores/panelOrderStore";
import { useSettings } from "@/stores/settingsStore";

interface ReorderableGroupProps {
  containerKey: ContainerKey;
  axis: "x" | "y";
  className?: string;
  children: Record<string, ReactNode>;
}

/** Single reorderable item with Alt+drag and double-click reset */
function ReorderableItem({
  id,
  children,
  onReset,
}: {
  id: string;
  children: ReactNode;
  onReset: () => void;
}) {
  const controls = useDragControls();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.altKey) {
        controls.start(e);
      }
    },
    [controls],
  );

  return (
    <Reorder.Item
      as="div"
      value={id}
      dragListener={false}
      dragControls={controls}
      onPointerDown={handlePointerDown}
      onDoubleClick={onReset}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        zIndex: 50,
        opacity: 0.95,
      }}
      transition={{ layout: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } }}
    >
      {children}
    </Reorder.Item>
  );
}

export function ReorderableGroup({
  containerKey,
  axis,
  className,
  children,
}: ReorderableGroupProps) {
  const order = usePanelOrderStore((s) => s[containerKey]);
  const setOrder = usePanelOrderStore((s) => s.setOrder);
  const resetOrder = usePanelOrderStore((s) => s.resetOrder);
  const { reduceMotion } = useSettings();

  // Desktop-only gate
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Alt-key cursor hint
  const [altHeld, setAltHeld] = useState(false);
  useEffect(() => {
    if (!isDesktop || reduceMotion) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Alt") setAltHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [isDesktop, reduceMotion]);

  const handleReorder = useCallback(
    (newOrder: string[]) => setOrder(containerKey, newOrder),
    [containerKey, setOrder],
  );

  const handleReset = useCallback(
    () => resetOrder(containerKey),
    [containerKey, resetOrder],
  );

  // Render order: use store order, filtered to only include keys that exist in children
  const childKeys = useMemo(() => Object.keys(children), [children]);
  const sortedKeys = useMemo(
    () => order.filter((id) => childKeys.includes(id)),
    [order, childKeys],
  );

  // Fallback: if drag is disabled, render in stored order but without Reorder wrappers
  if (!isDesktop || reduceMotion) {
    return (
      <div className={className}>
        {sortedKeys.map((id) => (
          <div key={id}>{children[id]}</div>
        ))}
      </div>
    );
  }

  return (
    <Reorder.Group
      as="div"
      axis={axis}
      values={sortedKeys}
      onReorder={handleReorder}
      className={className}
      style={altHeld ? { cursor: "grab" } : undefined}
    >
      {sortedKeys.map((id) => (
        <ReorderableItem key={id} id={id} onReset={handleReset}>
          {children[id]}
        </ReorderableItem>
      ))}
    </Reorder.Group>
  );
}
