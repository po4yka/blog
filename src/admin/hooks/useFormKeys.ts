import { useEffect, useRef } from "react";
import { useBlocker } from "react-router";

/**
 * Cmd/Ctrl+S runs `save` while `enabled`. The browser's "Save page" dialog is
 * always suppressed on admin forms, so a clean form does not open it either.
 */
export function useSaveShortcut(save: () => void, enabled: boolean) {
  const saveRef = useRef(save);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    saveRef.current = save;
    enabledRef.current = enabled;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (enabledRef.current) saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/**
 * Ask before unsaved edits are lost: a confirm for in-app navigation (sidebar,
 * shortcuts, browser back) and the browser prompt for reload or close.
 * Returns `allowNavigation`, for a save that redirects before `dirty` updates.
 */
export function useUnsavedGuard(dirty: boolean): () => void {
  const dirtyRef = useRef(dirty);
  const bypassRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirty;
    if (!dirty) bypassRef.current = false;
  });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname && dirtyRef.current && !bypassRef.current,
  );
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("Discard unsaved changes?")) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  return () => {
    bypassRef.current = true;
  };
}
