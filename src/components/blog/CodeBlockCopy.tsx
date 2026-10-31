import { useEffect, type RefObject } from "react";
import { useLocale } from "@/stores/settingsStore";

// --- Copy-to-clipboard affordance for code fences ---

// Enhances already-rendered <pre> blocks inside the prerendered MDX body
// with a small copy button. The code text itself is already static HTML by
// the time this runs — only the button (chrome, not content) is added
// client-side, so nodes are built via createElement + textContent only
// (never innerHTML) and the effect fully tears down what it attached.
export function CodeBlockCopy({ contentRef }: { contentRef: RefObject<HTMLDivElement | null> }) {
  const { t } = useLocale();

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const pres = Array.from(root.querySelectorAll<HTMLPreElement>("pre")).filter(
      (pre) => !pre.dataset.copyAttached,
    );

    const cleanups = pres.map((pre) => {
      pre.dataset.copyAttached = "true";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "absolute top-2 right-2 px-1.5 py-0.5 border border-border rounded-[2px] font-mono text-[11px] leading-none text-muted-foreground-dim hover:text-foreground cursor-pointer active:opacity-70 transition-colors duration-150";
      btn.style.background = "var(--code-bg)";
      btn.textContent = "copy";
      btn.setAttribute("aria-label", t("blogPost.copyCode"));

      let resetTimer: ReturnType<typeof setTimeout> | undefined;
      const handleClick = () => {
        // read from the code child, not pre — the button itself lives inside
        // the pre, so pre.textContent would append its "copy" label
        navigator.clipboard
          .writeText(pre.querySelector("code")?.textContent ?? "")
          .then(() => {
            btn.textContent = "copied";
            btn.setAttribute("aria-label", t("blogPost.copied"));
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => {
              btn.textContent = "copy";
              btn.setAttribute("aria-label", t("blogPost.copyCode"));
            }, 1500);
          })
          .catch(() => { /* clipboard unavailable */ });
      };
      btn.addEventListener("click", handleClick);
      pre.appendChild(btn);

      return () => {
        clearTimeout(resetTimer);
        btn.removeEventListener("click", handleClick);
        btn.remove();
        delete pre.dataset.copyAttached;
      };
    });

    return () => cleanups.forEach((fn) => fn());
  }, [contentRef, t]);

  return null;
}
