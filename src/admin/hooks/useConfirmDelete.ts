import { useState, useCallback, useRef } from "react";

/**
 * Two-click confirm-delete pattern: first click arms the delete,
 * second click (within 3 s) executes it. Auto-resets after timeout.
 */
export function useConfirmDelete() {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestDelete = useCallback(
    (id: string, onConfirm: () => void) => {
      if (confirmingId === id) {
        // Second click -- execute
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        setConfirmingId(null);
        onConfirm();
      } else {
        // First click -- arm
        if (timerRef.current) clearTimeout(timerRef.current);
        setConfirmingId(id);
        timerRef.current = setTimeout(() => {
          setConfirmingId(null);
          timerRef.current = null;
        }, 3000);
      }
    },
    [confirmingId],
  );

  const cancelDelete = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setConfirmingId(null);
  }, []);

  return { confirmingId, requestDelete, cancelDelete } as const;
}
