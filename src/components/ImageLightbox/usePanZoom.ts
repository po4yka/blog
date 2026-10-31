import { useRef, useState } from "react";

interface PanState {
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
  moved: boolean;
}

/** Mouse drag-to-pan for the natural-size (zoomed) image wrapper. */
export function usePanZoom(naturalSize: boolean) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const suppressClickRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!naturalSize) return;
    if (event.pointerType !== "mouse") return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.setPointerCapture(event.pointerId);
    panStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: wrapper.scrollLeft,
      scrollTop: wrapper.scrollTop,
      moved: false,
    };
    setIsPanning(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = panStateRef.current;
    const wrapper = wrapperRef.current;
    if (!state || !wrapper) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (!state.moved && Math.abs(dx) + Math.abs(dy) > 3) {
      state.moved = true;
    }
    wrapper.scrollLeft = state.scrollLeft - dx;
    wrapper.scrollTop = state.scrollTop - dy;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = panStateRef.current;
    if (!state) return;
    wrapperRef.current?.releasePointerCapture(event.pointerId);
    const moved = state.moved;
    panStateRef.current = null;
    setIsPanning(false);
    if (moved) {
      suppressClickRef.current = true;
    }
  };

  const onPointerCancel = () => {
    panStateRef.current = null;
    setIsPanning(false);
  };

  /** True once after a pan gesture, so the click that ends it does not toggle zoom. */
  const consumeSuppressedClick = (): boolean => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  };

  return {
    wrapperRef,
    isPanning,
    consumeSuppressedClick,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
