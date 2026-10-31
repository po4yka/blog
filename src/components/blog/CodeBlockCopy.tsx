import { useEffect, type RefObject } from "react";
import { useLocale } from "@/stores/settingsStore";

// --- Copy-to-clipboard for code fences ---

// The copy button is static HTML rendered at build time by transformerCodeBlock
// (src/lib/shiki-code-block.ts). This binds one delegated click handler on the
// prose root; it only swaps the clicked button's label, never builds DOM.
export function CodeBlockCopy({ contentRef }: { contentRef: RefObject<HTMLDivElement | null> }) {
  const { t } = useLocale();

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const timers = new Map<HTMLButtonElement, ReturnType<typeof setTimeout>>();

    // the build sets the post's own locale label; keep it to restore after "copied"
    const setLabel = (btn: HTMLButtonElement, copied: boolean) => {
      btn.dataset.label ??= btn.getAttribute("aria-label") ?? t("blogPost.copyCode");
      btn.textContent = copied ? "copied" : "copy";
      btn.setAttribute("aria-label", copied ? t("blogPost.copied") : btn.dataset.label);
    };

    const handleClick = (event: MouseEvent) => {
      const btn = (event.target as Element).closest<HTMLButtonElement>("button[data-copy-code]");
      if (!btn || !root.contains(btn) || !navigator.clipboard) return;
      // line numbers are CSS counters, so the code text holds only the code
      const code = btn.closest(".code-block")?.querySelector("pre code")?.textContent ?? "";
      navigator.clipboard
        .writeText(code)
        .then(() => {
          setLabel(btn, true);
          clearTimeout(timers.get(btn));
          timers.set(btn, setTimeout(() => setLabel(btn, false), 1500));
        })
        .catch(() => { /* clipboard unavailable */ });
    };

    root.addEventListener("click", handleClick);
    return () => {
      root.removeEventListener("click", handleClick);
      timers.forEach((timer, btn) => {
        clearTimeout(timer);
        setLabel(btn, false);
      });
    };
  }, [contentRef, t]);

  return null;
}
